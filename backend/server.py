from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query, Request, Response
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import cloudinary
import cloudinary.utils
import time
import asyncio
import resend
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'card-wholesale-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 168  # 7 days

# Cloudinary config
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

# Resend config
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

# Create the main app
app = FastAPI(title="Card Wholesale API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserRegister(BaseModel):
    shop_name: str
    owner_name: str
    mobile: str
    email: EmailStr
    address: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    shop_name: Optional[str] = None
    owner_name: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    role: str
    status: str
    picture: Optional[str] = None
    created_at: Optional[str] = None

class UserApproval(BaseModel):
    user_id: str
    approved: bool

class CardCreate(BaseModel):
    design_number: str
    image_url: str
    category: Optional[str] = "General"

class CardResponse(BaseModel):
    card_id: str
    design_number: str
    image_url: str
    category: str
    created_at: str

class CardUpdate(BaseModel):
    design_number: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None

class OrderCreate(BaseModel):
    card_id: str
    design_number: str
    quantity: int
    message: str
    delivery_address: str
    special_instructions: Optional[str] = ""

class OrderStatusUpdate(BaseModel):
    status: str
    design_preview_url: Optional[str] = None
    invoice_url: Optional[str] = None
    transport_bill_url: Optional[str] = None
    admin_notes: Optional[str] = None

class OrderResponse(BaseModel):
    order_id: str
    retailer_id: str
    retailer_name: str
    retailer_shop: str
    card_id: str
    design_number: str
    card_image_url: Optional[str] = None
    quantity: int
    message: str
    delivery_address: str
    special_instructions: str
    status: str
    design_preview_url: Optional[str] = None
    invoice_url: Optional[str] = None
    transport_bill_url: Optional[str] = None
    admin_notes: Optional[str] = None
    revision_notes: Optional[str] = None
    created_at: str
    updated_at: str
    timeline: List[dict] = []

class DesignApproval(BaseModel):
    approved: bool
    revision_notes: Optional[str] = None

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> dict:
    # Check session_token cookie first (for Google OAuth)
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
    
    # Fallback to Authorization header (JWT)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_jwt_token(token)
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if user:
            return user
    
    raise HTTPException(status_code=401, detail="Not authenticated")

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_approved_retailer(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("status") != "approved" and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Account not approved")
    return user

# ============== EMAIL HELPER ==============

async def send_status_email(to_email: str, subject: str, html_content: str):
    if not resend.api_key:
        logger.warning("Resend API key not configured, skipping email")
        return
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.owner_name,
        "shop_name": data.shop_name,
        "owner_name": data.owner_name,
        "mobile": data.mobile,
        "address": data.address,
        "password_hash": hash_password(data.password),
        "role": "retailer",
        "status": "pending",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    return {"message": "Registration successful. Please wait for admin approval.", "user_id": user_id}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("password_hash") or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("status") == "pending":
        raise HTTPException(status_code=403, detail="Account pending approval")
    
    if user.get("status") == "rejected":
        raise HTTPException(status_code=403, detail="Account has been rejected")
    
    token = create_jwt_token(user["user_id"], user["email"], user["role"])
    
    return {
        "token": token,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user.get("name") or user.get("owner_name"),
            "shop_name": user.get("shop_name"),
            "owner_name": user.get("owner_name"),
            "mobile": user.get("mobile"),
            "address": user.get("address"),
            "role": user["role"],
            "status": user["status"],
            "picture": user.get("picture")
        }
    }

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id from Emergent OAuth for user data"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent OAuth to get user data
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if res.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            oauth_data = res.json()
        except Exception as e:
            logger.error(f"OAuth session exchange failed: {e}")
            raise HTTPException(status_code=401, detail="Session exchange failed")
    
    email = oauth_data.get("email")
    name = oauth_data.get("name")
    picture = oauth_data.get("picture")
    session_token = oauth_data.get("session_token")
    
    # Check if user exists
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if user:
        # Update existing user
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
        user = await db.users.find_one({"email": email}, {"_id": 0})
    else:
        # Create new user (Google users are auto-approved as retailers)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "shop_name": "",
            "owner_name": name,
            "mobile": "",
            "address": "",
            "password_hash": None,
            "role": "retailer",
            "status": "pending",  # Still needs approval
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user.get("name"),
            "shop_name": user.get("shop_name"),
            "owner_name": user.get("owner_name"),
            "mobile": user.get("mobile"),
            "address": user.get("address"),
            "role": user["role"],
            "status": user["status"],
            "picture": user.get("picture")
        }
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user.get("name") or user.get("owner_name"),
        "shop_name": user.get("shop_name"),
        "owner_name": user.get("owner_name"),
        "mobile": user.get("mobile"),
        "address": user.get("address"),
        "role": user["role"],
        "status": user["status"],
        "picture": user.get("picture")
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

@api_router.put("/auth/profile")
async def update_profile(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    update_data = {}
    for field in ["shop_name", "owner_name", "mobile", "address", "name"]:
        if field in body:
            update_data[field] = body[field]
    
    if update_data:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {
        "user_id": updated_user["user_id"],
        "email": updated_user["email"],
        "name": updated_user.get("name") or updated_user.get("owner_name"),
        "shop_name": updated_user.get("shop_name"),
        "owner_name": updated_user.get("owner_name"),
        "mobile": updated_user.get("mobile"),
        "address": updated_user.get("address"),
        "role": updated_user["role"],
        "status": updated_user["status"],
        "picture": updated_user.get("picture")
    }

# ============== ADMIN USER MANAGEMENT ==============

@api_router.get("/admin/users/pending")
async def get_pending_users(request: Request):
    await get_admin_user(request)
    users = await db.users.find({"status": "pending", "role": "retailer"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/admin/users")
async def get_all_users(request: Request):
    await get_admin_user(request)
    users = await db.users.find({"role": "retailer"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.post("/admin/users/approve")
async def approve_user(data: UserApproval, request: Request):
    await get_admin_user(request)
    
    user = await db.users.find_one({"user_id": data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = "approved" if data.approved else "rejected"
    await db.users.update_one({"user_id": data.user_id}, {"$set": {"status": new_status}})
    
    # Send email notification
    status_text = "approved" if data.approved else "rejected"
    await send_status_email(
        user["email"],
        f"Account {status_text.title()} - Card Wholesale",
        f"""
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Account {status_text.title()}</h2>
            <p>Dear {user.get('owner_name', user.get('name', 'User'))},</p>
            <p>Your account has been <strong>{status_text}</strong> by the admin.</p>
            {'<p>You can now log in to your account and start placing orders.</p>' if data.approved else '<p>Please contact support for more information.</p>'}
        </div>
        """
    )
    
    return {"message": f"User {status_text}", "user_id": data.user_id}

# ============== CARD CATALOG ==============

@api_router.post("/admin/cards")
async def create_card(data: CardCreate, request: Request):
    await get_admin_user(request)
    
    existing = await db.cards.find_one({"design_number": data.design_number}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Design number already exists")
    
    card_id = f"card_{uuid.uuid4().hex[:12]}"
    card_doc = {
        "card_id": card_id,
        "design_number": data.design_number,
        "image_url": data.image_url,
        "category": data.category,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cards.insert_one(card_doc)
    
    return {"message": "Card created", "card_id": card_id}

@api_router.get("/cards")
async def get_cards(request: Request, category: Optional[str] = None, search: Optional[str] = None):
    await get_current_user(request)
    
    query = {}
    if category:
        query["category"] = category
    if search:
        query["design_number"] = {"$regex": search, "$options": "i"}
    
    cards = await db.cards.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return cards

@api_router.get("/cards/{card_id}")
async def get_card(card_id: str, request: Request):
    await get_current_user(request)
    card = await db.cards.find_one({"card_id": card_id}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

@api_router.put("/admin/cards/{card_id}")
async def update_card(card_id: str, data: CardUpdate, request: Request):
    await get_admin_user(request)
    
    card = await db.cards.find_one({"card_id": card_id}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.cards.update_one({"card_id": card_id}, {"$set": update_data})
    
    return {"message": "Card updated"}

@api_router.delete("/admin/cards/{card_id}")
async def delete_card(card_id: str, request: Request):
    await get_admin_user(request)
    
    result = await db.cards.delete_one({"card_id": card_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Card not found")
    
    return {"message": "Card deleted"}

@api_router.get("/cards/categories/list")
async def get_categories(request: Request):
    await get_current_user(request)
    categories = await db.cards.distinct("category")
    return categories

# ============== ORDERS ==============

@api_router.post("/orders")
async def create_order(data: OrderCreate, request: Request):
    user = await get_approved_retailer(request)
    
    card = await db.cards.find_one({"card_id": data.card_id}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    order_doc = {
        "order_id": order_id,
        "retailer_id": user["user_id"],
        "retailer_name": user.get("owner_name") or user.get("name"),
        "retailer_shop": user.get("shop_name", ""),
        "retailer_email": user.get("email"),
        "card_id": data.card_id,
        "design_number": data.design_number,
        "card_image_url": card.get("image_url"),
        "quantity": data.quantity,
        "message": data.message,
        "delivery_address": data.delivery_address,
        "special_instructions": data.special_instructions or "",
        "status": "pending",
        "design_preview_url": None,
        "invoice_url": None,
        "transport_bill_url": None,
        "admin_notes": None,
        "revision_notes": None,
        "created_at": now,
        "updated_at": now,
        "timeline": [{"status": "pending", "timestamp": now, "note": "Order placed"}]
    }
    await db.orders.insert_one(order_doc)
    
    return {"message": "Order placed successfully", "order_id": order_id}

@api_router.get("/orders")
async def get_orders(request: Request, status: Optional[str] = None):
    user = await get_approved_retailer(request)
    
    query = {"retailer_id": user["user_id"]}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_approved_retailer(request)
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Retailers can only see their own orders
    if user["role"] != "admin" and order["retailer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return order

@api_router.post("/orders/{order_id}/approve-design")
async def approve_design(order_id: str, data: DesignApproval, request: Request):
    user = await get_approved_retailer(request)
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["retailer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if order["status"] != "design_sent":
        raise HTTPException(status_code=400, detail="No design to approve")
    
    now = datetime.now(timezone.utc).isoformat()
    
    if data.approved:
        new_status = "design_approved"
        timeline_note = "Design approved by retailer"
    else:
        new_status = "revision_requested"
        timeline_note = f"Revision requested: {data.revision_notes or 'No notes'}"
    
    timeline = order.get("timeline", [])
    timeline.append({"status": new_status, "timestamp": now, "note": timeline_note})
    
    update_data = {
        "status": new_status,
        "updated_at": now,
        "timeline": timeline
    }
    if data.revision_notes:
        update_data["revision_notes"] = data.revision_notes
    
    await db.orders.update_one({"order_id": order_id}, {"$set": update_data})
    
    return {"message": f"Design {new_status.replace('_', ' ')}"}

# ============== ADMIN ORDER MANAGEMENT ==============

@api_router.get("/admin/orders")
async def get_all_orders(request: Request, status: Optional[str] = None):
    await get_admin_user(request)
    
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, request: Request):
    await get_admin_user(request)
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Validate: design_sent requires design_preview_url
    if data.status == "design_sent":
        existing_preview = order.get("design_preview_url")
        if not data.design_preview_url and not existing_preview:
            raise HTTPException(status_code=400, detail="Design preview is required when setting status to 'Design Sent'")
    
    # Validate: completed requires invoice
    if data.status == "completed":
        existing_invoice = order.get("invoice_url")
        if not data.invoice_url and not existing_invoice:
            raise HTTPException(status_code=400, detail="Invoice is required when marking order as completed")
    
    now = datetime.now(timezone.utc).isoformat()
    timeline = order.get("timeline", [])
    
    status_notes = {
        "design_sent": "Design preview sent for approval",
        "revision_requested": "Retailer requested revision",
        "design_approved": "Design approved",
        "completed": "Order completed and dispatched"
    }
    
    timeline.append({
        "status": data.status,
        "timestamp": now,
        "note": data.admin_notes or status_notes.get(data.status, f"Status changed to {data.status}")
    })
    
    update_data = {
        "status": data.status,
        "updated_at": now,
        "timeline": timeline
    }
    
    if data.design_preview_url:
        update_data["design_preview_url"] = data.design_preview_url
    if data.invoice_url:
        update_data["invoice_url"] = data.invoice_url
    if data.transport_bill_url:
        update_data["transport_bill_url"] = data.transport_bill_url
    if data.admin_notes:
        update_data["admin_notes"] = data.admin_notes
    
    await db.orders.update_one({"order_id": order_id}, {"$set": update_data})
    
    # Send email notification
    retailer_email = order.get("retailer_email")
    if retailer_email:
        await send_status_email(
            retailer_email,
            f"Order Update - {data.status.replace('_', ' ').title()}",
            f"""
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Order Status Update</h2>
                <p>Your order <strong>{order['design_number']}</strong> has been updated.</p>
                <p>New Status: <strong>{data.status.replace('_', ' ').title()}</strong></p>
                {f'<p>Note: {data.admin_notes}</p>' if data.admin_notes else ''}
                <p>Please log in to view details.</p>
            </div>
            """
        )
    
    return {"message": "Order status updated"}

# ============== ADMIN DASHBOARD STATS ==============

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    await get_admin_user(request)
    
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    total_retailers = await db.users.count_documents({"role": "retailer", "status": "approved"})
    pending_retailers = await db.users.count_documents({"role": "retailer", "status": "pending"})
    total_cards = await db.cards.count_documents({})
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "total_retailers": total_retailers,
        "pending_retailers": pending_retailers,
        "total_cards": total_cards
    }

# ============== CLOUDINARY SIGNATURE ==============

@api_router.get("/cloudinary/signature")
async def get_cloudinary_signature(
    request: Request,
    resource_type: str = Query("image", enum=["image", "raw"]),
    folder: str = "card_wholesale"
):
    await get_current_user(request)
    
    ALLOWED_FOLDERS = ("card_wholesale", "designs", "invoices", "transport")
    if not any(folder.startswith(f) for f in ALLOWED_FOLDERS):
        raise HTTPException(status_code=400, detail="Invalid folder path")
    
    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": folder,
        "resource_type": resource_type
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        os.environ.get("CLOUDINARY_API_SECRET")
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.environ.get("CLOUDINARY_API_KEY"),
        "folder": folder,
        "resource_type": resource_type
    }

# ============== SEED DEFAULT ADMIN ==============

@app.on_event("startup")
async def seed_admin():
    admin = await db.users.find_one({"email": "admin@psbots.com"}, {"_id": 0})
    if not admin:
        admin_doc = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": "admin@cardwholesale.com",
            "name": "Admin",
            "shop_name": "Card Wholesale HQ",
            "owner_name": "Admin",
            "mobile": "0000000000",
            "address": "Admin Office",
            "password_hash": hash_password("Pradarsh123"),
            "role": "admin",
            "status": "approved",
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Default admin created: admin@cardwholesale.com / admin123")

# Include router and CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
