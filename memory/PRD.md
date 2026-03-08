# Card Wholesale Ordering System - PRD

## Original Problem Statement
Create a modern responsive web application for a Card Wholesale Ordering System with two roles: Retailer and Admin (Wholesaler). The UI should be clean, modern, mobile friendly, and simple for shop owners to use. Use a dashboard style interface similar to modern SaaS apps with sidebar navigation.

## User Personas

### 1. Retailer (Shop Owner)
- Needs to browse card catalog
- Places bulk orders with custom text
- Reviews design previews
- Tracks order status

### 2. Admin (Wholesaler)
- Manages retailer approvals
- Uploads card designs
- Processes orders
- Sends design previews and invoices

## Core Requirements (Static)

### Authentication
- [x] JWT-based email/password login
- [x] Google OAuth via Emergent Auth
- [x] Role-based access (admin/retailer)
- [x] Retailer approval workflow

### Retailer Features
- [x] Registration with shop details
- [x] Card catalog browsing with search/filter
- [x] Order placement with quantity, message, address
- [x] Order tracking with status timeline
- [x] Design preview approval/revision
- [x] Profile management

### Admin Features
- [x] Dashboard with stats overview
- [x] User approval panel
- [x] Card management (CRUD)
- [x] Order management
- [x] Design preview upload
- [x] Invoice/transport bill upload

## What's Been Implemented (MVP - March 8, 2026)

### Backend (FastAPI + MongoDB)
- User authentication (JWT + Google OAuth)
- User registration with pending approval
- Admin user approval/rejection
- Card catalog CRUD operations
- Order management with status workflow
- Cloudinary signature endpoint for uploads
- Email notification integration (Resend)

### Frontend (React + Tailwind CSS)
- Modern SaaS-style dashboard UI
- Dark Blue (#1E3A8A) / Orange (#F97316) theme
- Responsive sidebar navigation
- Login/Register pages with Google OAuth
- Pending approval screen
- Card catalog with grid layout
- Order form with all fields
- Order tracking with timeline
- Admin dashboard with stats
- Admin user approval panel
- Admin card management
- Admin order management with file uploads

### Default Credentials
- Admin: admin@cardwholesale.com / admin123

## Prioritized Backlog

### P0 - Critical (Next)
- Configure Cloudinary credentials
- Configure Resend API key for emails
- Add more sample card designs

### P1 - Important
- Bulk card upload feature
- Order status email notifications
- Search retailers by name/shop
- Order filtering by date range

### P2 - Nice to Have
- SMS notifications (Twilio)
- Order export to CSV/PDF
- Analytics dashboard
- Mobile app (React Native)

## Technical Stack
- Frontend: React 19, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, Motor (async MongoDB)
- Database: MongoDB
- Auth: JWT + Emergent Google OAuth
- Storage: Cloudinary (configured, needs keys)
- Email: Resend (configured, needs keys)

## Next Tasks
1. Collect Cloudinary API credentials from user
2. Collect Resend API key from user
3. Upload sample card designs (150+)
4. Test full order flow end-to-end
5. Enable email notifications
