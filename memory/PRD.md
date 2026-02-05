# RentAll - Marketplace PRD

## Original Problem Statement
Build an app similar to Airbnb but for renting anything - from music instruments to kitchen appliances to party equipment, cars, heavy machinery, tradies, anything. Location-based where users can search for items in their area. People list whatever they want to rent. Platform takes 5% of every transaction.

## User Choices
- **Payments**: Stripe (5% platform fee, 95% to owners)
- **Authentication**: JWT-based custom auth
- **Communication**: In-app messaging
- **Features**: All (location search, reviews, booking calendar, image uploads, safety pages)
- **App Type**: Progressive Web App (PWA) - installable on mobile devices

## Architecture

### Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Stripe Checkout + Stripe Connect (auto-payouts)
- **Image Storage**: Base64 in MongoDB
- **Maps**: Mapbox GL
- **SMS**: Twilio (phone verification)
- **App Type**: PWA (Progressive Web App)

### Key Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/register | POST | User registration |
| /api/auth/login | POST | User login |
| /api/auth/me | GET | Get current user |
| /api/listings | GET/POST | List/create listings |
| /api/listings/{id} | GET/PUT/DELETE | CRUD for listings |
| /api/bookings | POST | Create booking |
| /api/bookings/my | GET | Get user's bookings |
| /api/reviews | POST | Create review |
| /api/messages | POST/GET | Messaging system |
| /api/payments/checkout | POST | Create Stripe checkout |
| /api/upload/image | POST | Upload image (base64) |
| /api/images/{id} | GET | Retrieve image |
| /api/payouts/summary | GET | Get payout summary |
| /api/payouts/request | POST | Request payout |
| /api/categories | GET | Get all 33 categories |

## User Personas
1. **Renter**: Wants to borrow items/services affordably
2. **Owner**: Wants to monetize unused belongings or skills
3. **Both**: Many users do both

## Core Requirements (Static)
- [x] User registration & authentication (JWT)
- [x] Item listing with images, description, pricing
- [x] 33 categories (vehicles, machinery, services, home, events, etc.)
- [x] Search functionality with filters
- [x] Booking calendar with availability
- [x] Stripe payment processing (5% fee)
- [x] In-app messaging between users
- [x] User dashboard (listings, bookings, requests)
- [x] Review system (post-rental)
- [x] Image upload functionality
- [x] Payout tracking system
- [x] Safety & Trust pages

## What's Been Implemented (Feb 5, 2026)

### Phase 1 - MVP
- Full CRUD for listings, bookings, reviews, messages
- JWT authentication with secure password hashing
- Stripe Checkout integration with webhook support
- MongoDB collections: users, listings, bookings, reviews, messages, payment_transactions
- 5% platform fee calculation on all bookings
- Responsive frontend with Plus Jakarta Sans/Inter fonts
- Terracotta (#E05D44) primary color scheme

### Phase 2 - Trust & Safety Features
- **Image Upload System**: Base64 upload to MongoDB, retrieval via API
- **33 Categories**: Vehicles, Heavy Machinery, Tradies, Tools, Party, Sports, Tech, Fashion, etc.
- **Safety Pages**: How It Works, Safety Guidelines, Terms of Service, Privacy Policy
- **Payout Tracking**: Earnings summary, pending payouts, payout requests
- **Enhanced User Model**: phone_verified, id_verified, total_earnings, pending_payout
- **Damage Deposit**: Optional deposit field on listings
- **Global Footer**: Navigation to all info/legal pages

### Phase 3 - Maps, Verification & Payouts
- **Mapbox Integration**: Interactive map view on search page, static maps on listing details
- **Twilio Phone Verification**: SMS-based phone number verification
- **Stripe Connect**: Automated 95/5 split payouts to item owners
- **Anti-bypass Messaging**: Filter contact info in messages before booking confirmation

### Phase 4 - PWA (Progressive Web App) ✅ NEW
- **manifest.json**: App name, icons, theme colors, shortcuts
- **Service Worker**: Offline caching, background sync capability
- **Offline Page**: Custom offline fallback with retry mechanism
- **Mobile Bottom Navbar**: Fixed bottom navigation for mobile users (Home, Search, List, Messages, Profile)
- **Install Prompt**: Smart install banner for iOS and Android
- **PWA Meta Tags**: Apple touch icons, theme-color, mobile-web-app-capable
- **App Icons**: Custom 192x192 and 512x512 PNG icons

## Pages
- `/` - Homepage with hero, categories, featured listings
- `/search` - Search with filters and 33 category icons
- `/listing/:id` - Listing detail with calendar, reviews, booking
- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard (listings, rentals, requests)
- `/create-listing` - Create listing with image upload
- `/messages` - In-app messaging
- `/how-it-works` - How the platform works
- `/safety` - Safety guidelines and safe trade checklist
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy
- `/payment/success` - Payment confirmation
- `/payment/cancel` - Payment cancelled

## Prioritized Backlog

### P0 (Critical) - Done ✅
- User authentication
- Listing creation/viewing
- Booking flow
- Payment processing
- Image uploads
- Safety/Trust pages
- Map view for location search

### P1 (High Priority) - Next
- [ ] Phone verification (Twilio)
- [ ] Email notifications (SendGrid)
- [ ] Stripe Connect for real auto-payouts

### P2 (Medium Priority)
- [ ] Advanced search filters (availability dates)
- [ ] Favorite/saved items
- [ ] Owner verification badges
- [ ] Booking modification/cancellation

### P3 (Nice to Have)
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Price recommendations AI
- [ ] Social sharing

## Next Tasks
1. Add phone verification (Twilio)
2. Integrate map view (Mapbox/Google Maps)
3. Add email notifications (SendGrid)
4. Implement Stripe Connect for real payouts
5. Add ID verification flow
