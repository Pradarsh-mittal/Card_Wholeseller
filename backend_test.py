import requests
import sys
from datetime import datetime

class CardWholesaleAPITester:
    def __init__(self, base_url="https://card-wholesale.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.retailer_token = None
        self.retailer_user_id = None
        self.card_id = None
        self.order_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.errors = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name}: {details}")
            self.errors.append(f"{test_name}: {details}")

    def make_request(self, method, endpoint, data=None, token=None, expected_status=None):
        """Make API request with error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            if expected_status and response.status_code != expected_status:
                return False, f"Expected {expected_status}, got {response.status_code}: {response.text}"

            return True, response
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}"

    def test_admin_login(self):
        """Test admin login with default credentials"""
        print("\n🔐 Testing Admin Authentication...")
        
        success, result = self.make_request('POST', 'auth/login', {
            "email": "admin@cardwholesale.com",
            "password": "admin123"
        }, expected_status=200)
        
        if success:
            try:
                data = result.json()
                if 'token' in data and 'user' in data:
                    self.admin_token = data['token']
                    user = data['user']
                    if user.get('role') == 'admin':
                        self.log_result("Admin login successful", True)
                        return True
                    else:
                        self.log_result("Admin login", False, f"Wrong role: {user.get('role')}")
                else:
                    self.log_result("Admin login", False, "Missing token or user in response")
            except Exception as e:
                self.log_result("Admin login", False, f"Invalid JSON response: {str(e)}")
        else:
            self.log_result("Admin login", False, result)
        
        return False

    def test_retailer_registration(self):
        """Test retailer registration"""
        print("\n👤 Testing Retailer Registration...")
        
        timestamp = str(int(datetime.now().timestamp()))
        retailer_data = {
            "shop_name": f"Test Shop {timestamp}",
            "owner_name": f"Test Owner {timestamp}",
            "mobile": "1234567890",
            "email": f"retailer{timestamp}@test.com",
            "address": "123 Test Street",
            "password": "testpass123"
        }
        
        success, result = self.make_request('POST', 'auth/register', retailer_data, expected_status=200)
        
        if success:
            try:
                data = result.json()
                if 'user_id' in data:
                    self.retailer_user_id = data['user_id']
                    self.log_result("Retailer registration successful", True)
                    return retailer_data
                else:
                    self.log_result("Retailer registration", False, "Missing user_id in response")
            except Exception as e:
                self.log_result("Retailer registration", False, f"Invalid JSON response: {str(e)}")
        else:
            self.log_result("Retailer registration", False, result)
        
        return None

    def test_admin_stats(self):
        """Test admin dashboard stats"""
        print("\n📊 Testing Admin Stats...")
        
        if not self.admin_token:
            self.log_result("Admin stats", False, "No admin token available")
            return False
            
        success, result = self.make_request('GET', 'admin/stats', token=self.admin_token, expected_status=200)
        
        if success:
            try:
                data = result.json()
                required_fields = ['total_orders', 'pending_orders', 'completed_orders', 
                                 'total_retailers', 'pending_retailers', 'total_cards']
                
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_result("Admin stats", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("Admin stats successful", True)
                    return True
            except Exception as e:
                self.log_result("Admin stats", False, f"Invalid JSON response: {str(e)}")
        else:
            self.log_result("Admin stats", False, result)
            
        return False

    def test_user_approval(self):
        """Test admin user approval functionality"""
        print("\n✅ Testing User Approval...")
        
        if not self.admin_token or not self.retailer_user_id:
            self.log_result("User approval", False, "Missing admin token or retailer ID")
            return False

        # First, get pending users
        success, result = self.make_request('GET', 'admin/users/pending', token=self.admin_token, expected_status=200)
        
        if not success:
            self.log_result("Get pending users", False, result)
            return False
            
        # Approve the retailer
        success, result = self.make_request('POST', 'admin/users/approve', {
            "user_id": self.retailer_user_id,
            "approved": True
        }, token=self.admin_token, expected_status=200)
        
        if success:
            self.log_result("User approval successful", True)
            return True
        else:
            self.log_result("User approval", False, result)
            return False

    def test_retailer_login(self, retailer_data):
        """Test retailer login after approval"""
        print("\n🔐 Testing Retailer Login...")
        
        if not retailer_data:
            self.log_result("Retailer login", False, "No retailer data available")
            return False
            
        success, result = self.make_request('POST', 'auth/login', {
            "email": retailer_data['email'],
            "password": retailer_data['password']
        }, expected_status=200)
        
        if success:
            try:
                data = result.json()
                if 'token' in data and 'user' in data:
                    self.retailer_token = data['token']
                    user = data['user']
                    if user.get('role') == 'retailer' and user.get('status') == 'approved':
                        self.log_result("Retailer login successful", True)
                        return True
                    else:
                        self.log_result("Retailer login", False, f"Wrong role/status: {user.get('role')}/{user.get('status')}")
                else:
                    self.log_result("Retailer login", False, "Missing token or user in response")
            except Exception as e:
                self.log_result("Retailer login", False, f"Invalid JSON response: {str(e)}")
        else:
            self.log_result("Retailer login", False, result)
            
        return False

    def test_card_management(self):
        """Test admin card creation"""
        print("\n🃏 Testing Card Management...")
        
        if not self.admin_token:
            self.log_result("Card creation", False, "No admin token available")
            return False

        # Create a test card
        card_data = {
            "design_number": f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "image_url": "https://images.unsplash.com/photo-1577086664341-033ee09074ec?w=400&h=600&fit=crop",
            "category": "Test Category"
        }
        
        success, result = self.make_request('POST', 'admin/cards', card_data, token=self.admin_token, expected_status=200)
        
        if success:
            try:
                data = result.json()
                if 'card_id' in data:
                    self.card_id = data['card_id']
                    self.log_result("Card creation successful", True)
                    return True
                else:
                    self.log_result("Card creation", False, "Missing card_id in response")
            except Exception as e:
                self.log_result("Card creation", False, f"Invalid JSON response: {str(e)}")
        else:
            self.log_result("Card creation", False, result)
            
        return False

    def test_card_catalog(self):
        """Test card catalog access for retailers"""
        print("\n📚 Testing Card Catalog...")
        
        if not self.retailer_token:
            self.log_result("Card catalog access", False, "No retailer token available")
            return False
            
        success, result = self.make_request('GET', 'cards', token=self.retailer_token, expected_status=200)
        
        if success:
            try:
                cards = result.json()
                if isinstance(cards, list):
                    self.log_result(f"Card catalog access successful ({len(cards)} cards)", True)
                    return True
                else:
                    self.log_result("Card catalog access", False, "Response is not a list")
            except Exception as e:
                self.log_result("Card catalog access", False, f"Invalid JSON response: {str(e)}")
        else:
            self.log_result("Card catalog access", False, result)
            
        return False

    def test_order_placement(self):
        """Test order placement by retailer"""
        print("\n🛒 Testing Order Placement...")
        
        if not self.retailer_token or not self.card_id:
            self.log_result("Order placement", False, "Missing retailer token or card ID")
            return False

        order_data = {
            "card_id": self.card_id,
            "design_number": "TEST-ORDER",
            "quantity": 100,
            "message": "Test order message for testing",
            "delivery_address": "123 Test Delivery Address",
            "special_instructions": "Handle with care - test order"
        }
        
        success, result = self.make_request('POST', 'orders', order_data, token=self.retailer_token, expected_status=200)
        
        if success:
            try:
                data = result.json()
                if 'order_id' in data:
                    self.order_id = data['order_id']
                    self.log_result("Order placement successful", True)
                    return True
                else:
                    self.log_result("Order placement", False, "Missing order_id in response")
            except Exception as e:
                self.log_result("Order placement", False, f"Invalid JSON response: {str(e)}")
        else:
            self.log_result("Order placement", False, result)
            
        return False

    def test_order_management(self):
        """Test admin order management"""
        print("\n📋 Testing Order Management...")
        
        if not self.admin_token:
            self.log_result("Admin order management", False, "No admin token available")
            return False
            
        # Get all orders
        success, result = self.make_request('GET', 'admin/orders', token=self.admin_token, expected_status=200)
        
        if success:
            try:
                orders = result.json()
                if isinstance(orders, list):
                    self.log_result(f"Order management access successful ({len(orders)} orders)", True)
                    return True
                else:
                    self.log_result("Order management access", False, "Response is not a list")
            except Exception as e:
                self.log_result("Order management access", False, f"Invalid JSON response: {str(e)}")
        else:
            self.log_result("Order management access", False, result)
            
        return False

    def test_retailer_orders(self):
        """Test retailer's own orders access"""
        print("\n📦 Testing Retailer Orders Access...")
        
        if not self.retailer_token:
            self.log_result("Retailer orders access", False, "No retailer token available")
            return False
            
        success, result = self.make_request('GET', 'orders', token=self.retailer_token, expected_status=200)
        
        if success:
            try:
                orders = result.json()
                if isinstance(orders, list):
                    self.log_result(f"Retailer orders access successful ({len(orders)} orders)", True)
                    return True
                else:
                    self.log_result("Retailer orders access", False, "Response is not a list")
            except Exception as e:
                self.log_result("Retailer orders access", False, f"Invalid JSON response: {str(e)}")
        else:
            self.log_result("Retailer orders access", False, result)
            
        return False

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Card Wholesale API Tests...")
        print(f"Testing API: {self.base_url}")
        
        # Test admin functionality
        if not self.test_admin_login():
            print("❌ Admin login failed - cannot proceed with admin tests")
            return False
            
        self.test_admin_stats()
        
        # Test retailer registration and approval workflow
        retailer_data = self.test_retailer_registration()
        if retailer_data:
            self.test_user_approval()
            if self.test_retailer_login(retailer_data):
                # Test retailer functionality
                self.test_card_management()  # Create card as admin first
                self.test_card_catalog()     # Access as retailer
                self.test_order_placement()  # Place order as retailer
                self.test_order_management() # View orders as admin
                self.test_retailer_orders()  # View own orders as retailer
        
        # Print results
        print(f"\n📊 Test Results:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.errors:
            print(f"\n❌ Failed Tests:")
            for error in self.errors:
                print(f"  • {error}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CardWholesaleAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())