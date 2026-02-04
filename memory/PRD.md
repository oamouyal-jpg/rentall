# RentAll - Marketplace PRD

## Original Problem Statement
Build an app similar to Airbnb but for renting anything - from music instruments to kitchen appliances to party equipment to space tools, cars, anything. Location-based where users can search for items in their area. People download the app and list whatever they want to rent. Platform takes 5% of every transaction.

## User Choices
- **Payments**: Stripe (5% platform fee)
- **Authentication**: JWT-based custom auth
- **Communication**: In-app messaging
- **Features**: All (location search, reviews, booking calendar)

## Architecture

### Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Stripe Checkout (emergentintegrations library)

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
| /api/categories | GET | Get all categories |

## User Personas
1. **Renter**: Wants to borrow items affordably
2. **Owner**: Wants to monetize unused belongings
3. **Both**: Many users do both

## Core Requirements (Static)
- [x] User registration & authentication (JWT)
- [x] Item listing with images, description, pricing
- [x] Category-based browsing (10 categories)
- [x] Search functionality with filters
- [x] Booking calendar with availability
- [x] Stripe payment processing (5% fee)
- [x] In-app messaging between users
- [x] User dashboard (listings, bookings, requests)
- [x] Review system (post-rental)

## What's Been Implemented (Feb 4, 2026)

### Backend (100% Complete)
- Full CRUD for listings, bookings, reviews, messages
- JWT authentication with secure password hashing
- Stripe Checkout integration with webhook support
- MongoDB collections: users, listings, bookings, reviews, messages, payment_transactions
- 5% platform fee calculation on all bookings

### Frontend (100% Complete)
- Homepage with hero, trust badges, categories, featured listings
- Search page with category filters and price range
- Listing detail page with image gallery, calendar, booking flow
- Dashboard with tabs (My Listings, My Rentals, Requests)
- Create listing page with image URL support
- Messages page with conversation list and chat UI
- Payment success/cancel pages with status polling
- Responsive design with Plus Jakarta Sans/Inter fonts
- Terracotta (#E05D44) primary, Sage (#8DA399) secondary color scheme

## Prioritized Backlog

### P0 (Critical) - Done
- ✅ User authentication
- ✅ Listing creation/viewing
- ✅ Booking flow
- ✅ Payment processing

### P1 (High Priority) - Future
- [ ] Image upload (currently URL-based)
- [ ] Map view for location search
- [ ] Email notifications
- [ ] Rating calculation improvements

### P2 (Medium Priority) - Future
- [ ] Advanced search filters (availability dates)
- [ ] Favorite/saved items
- [ ] Owner verification badges
- [ ] Booking modification/cancellation

### P3 (Nice to Have) - Future
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Price recommendations AI
- [ ] Social sharing

## Next Tasks
1. Add image upload functionality (S3/Cloudinary)
2. Integrate map view with Mapbox/Google Maps
3. Add email notifications (SendGrid)
4. Implement location-based search with geolocation
