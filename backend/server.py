from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from twilio.rest import Client as TwilioClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'rentall-super-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
PLATFORM_FEE_PERCENT = 5.0

# Twilio Config
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Create the main app
app = FastAPI(title="RentAll API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class UserBase(BaseModel):
    email: EmailStr
    name: str
    
class UserCreate(UserBase):
    password: str
    
class UserResponse(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str
    avatar_url: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    phone_verified: bool = False
    id_verified: bool = False
    total_earnings: float = 0.0
    pending_payout: float = 0.0

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class ListingBase(BaseModel):
    title: str
    description: str
    category: str
    price_per_day: float
    location: str
    latitude: float
    longitude: float
    images: List[str] = []
    damage_deposit: Optional[float] = 0.0
    min_rental_days: int = 1
    max_rental_days: int = 30
    
class ListingCreate(ListingBase):
    pass

class ListingResponse(ListingBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    owner_id: str
    owner_name: str
    owner_avatar: Optional[str] = None
    owner_verified: bool = False
    created_at: str
    avg_rating: float = 0.0
    review_count: int = 0
    is_available: bool = True

class ListingSearch(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = 50.0

class BookingBase(BaseModel):
    listing_id: str
    start_date: str
    end_date: str

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    renter_id: str
    renter_name: str
    owner_id: str
    total_price: float
    platform_fee: float
    status: str
    created_at: str
    listing_title: Optional[str] = None
    listing_image: Optional[str] = None

class ReviewBase(BaseModel):
    listing_id: str
    rating: int = Field(ge=1, le=5)
    comment: str

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    reviewer_id: str
    reviewer_name: str
    reviewer_avatar: Optional[str] = None
    created_at: str

class MessageBase(BaseModel):
    recipient_id: str
    content: str
    listing_id: Optional[str] = None

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    sender_id: str
    sender_name: str
    sender_avatar: Optional[str] = None
    created_at: str
    is_read: bool = False

class ConversationResponse(BaseModel):
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    last_message: str
    last_message_time: str
    unread_count: int
    listing_id: Optional[str] = None
    listing_title: Optional[str] = None

class CheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    session_id: str
    booking_id: str
    user_id: str
    amount: float
    currency: str = "usd"
    platform_fee: float
    owner_amount: float
    status: str
    payment_status: str
    created_at: str
    metadata: Dict = {}

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "avatar_url": None,
        "location": None,
        "bio": None,
        "phone_verified": False,
        "id_verified": False,
        "total_earnings": 0.0,
        "pending_payout": 0.0
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        created_at=user_doc["created_at"],
        phone_verified=False,
        id_verified=False,
        total_earnings=0.0,
        pending_payout=0.0
    )
    return TokenResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        created_at=user["created_at"],
        avatar_url=user.get("avatar_url"),
        location=user.get("location"),
        bio=user.get("bio"),
        phone_verified=user.get("phone_verified", False),
        id_verified=user.get("id_verified", False),
        total_earnings=user.get("total_earnings", 0.0),
        pending_payout=user.get("pending_payout", 0.0)
    )
    return TokenResponse(token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(
    updates: dict,
    current_user: dict = Depends(get_current_user)
):
    allowed_fields = ["name", "avatar_url", "location", "bio", "phone_number"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return UserResponse(**updated_user)

# ============== PHONE VERIFICATION ==============

class PhoneVerifyRequest(BaseModel):
    phone_number: str

class PhoneVerifyCode(BaseModel):
    phone_number: str
    code: str

@api_router.post("/auth/phone/send-code")
async def send_phone_verification_code(
    data: PhoneVerifyRequest,
    current_user: dict = Depends(get_current_user)
):
    if not twilio_client:
        raise HTTPException(status_code=500, detail="SMS service not configured")
    
    # Generate 6-digit code
    code = str(random.randint(100000, 999999))
    
    # Store code in database with expiry
    await db.verification_codes.update_one(
        {"user_id": current_user["id"], "type": "phone"},
        {
            "$set": {
                "user_id": current_user["id"],
                "type": "phone",
                "phone_number": data.phone_number,
                "code": code,
                "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    # Send SMS via Twilio
    try:
        message = twilio_client.messages.create(
            body=f"Your RentAll verification code is: {code}. Valid for 10 minutes.",
            from_=TWILIO_PHONE_NUMBER,
            to=data.phone_number
        )
        return {"message": "Verification code sent", "sid": message.sid}
    except Exception as e:
        logging.error(f"Twilio error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send SMS")

@api_router.post("/auth/phone/verify")
async def verify_phone_code(
    data: PhoneVerifyCode,
    current_user: dict = Depends(get_current_user)
):
    # Find verification code
    verification = await db.verification_codes.find_one({
        "user_id": current_user["id"],
        "type": "phone",
        "phone_number": data.phone_number
    })
    
    if not verification:
        raise HTTPException(status_code=400, detail="No verification code found")
    
    # Check if expired
    expires_at = datetime.fromisoformat(verification["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Verification code expired")
    
    # Check code
    if verification["code"] != data.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Mark phone as verified
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"phone_verified": True, "phone_number": data.phone_number}}
    )
    
    # Delete verification code
    await db.verification_codes.delete_one({"user_id": current_user["id"], "type": "phone"})
    
    return {"message": "Phone number verified successfully"}

# ============== LISTINGS ROUTES ==============

@api_router.post("/listings", response_model=ListingResponse)
async def create_listing(
    listing_data: ListingCreate,
    current_user: dict = Depends(get_current_user)
):
    listing_id = str(uuid.uuid4())
    listing_doc = {
        "id": listing_id,
        "owner_id": current_user["id"],
        "owner_name": current_user["name"],
        "owner_avatar": current_user.get("avatar_url"),
        **listing_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "avg_rating": 0.0,
        "review_count": 0,
        "is_available": True
    }
    await db.listings.insert_one(listing_doc)
    return ListingResponse(**listing_doc)

@api_router.get("/listings", response_model=List[ListingResponse])
async def get_listings(
    category: Optional[str] = None,
    query: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 50
):
    filter_query = {}
    
    if category:
        filter_query["category"] = category
    
    if query:
        filter_query["$or"] = [
            {"title": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}}
        ]
    
    if min_price is not None:
        filter_query["price_per_day"] = {"$gte": min_price}
    
    if max_price is not None:
        if "price_per_day" in filter_query:
            filter_query["price_per_day"]["$lte"] = max_price
        else:
            filter_query["price_per_day"] = {"$lte": max_price}
    
    listings = await db.listings.find(filter_query, {"_id": 0}).to_list(limit)
    return [ListingResponse(**l) for l in listings]

@api_router.get("/listings/featured", response_model=List[ListingResponse])
async def get_featured_listings(limit: int = 8):
    listings = await db.listings.find(
        {"is_available": True},
        {"_id": 0}
    ).sort("avg_rating", -1).to_list(limit)
    return [ListingResponse(**l) for l in listings]

@api_router.get("/listings/my", response_model=List[ListingResponse])
async def get_my_listings(current_user: dict = Depends(get_current_user)):
    listings = await db.listings.find(
        {"owner_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    return [ListingResponse(**l) for l in listings]

@api_router.get("/listings/{listing_id}", response_model=ListingResponse)
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingResponse(**listing)

@api_router.put("/listings/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: str,
    updates: dict,
    current_user: dict = Depends(get_current_user)
):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    allowed_fields = ["title", "description", "category", "price_per_day", "location", "latitude", "longitude", "images", "is_available"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if update_data:
        await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    
    updated = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    return ListingResponse(**updated)

@api_router.delete("/listings/{listing_id}")
async def delete_listing(
    listing_id: str,
    current_user: dict = Depends(get_current_user)
):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.listings.delete_one({"id": listing_id})
    return {"message": "Listing deleted"}

# ============== BOOKINGS ROUTES ==============

@api_router.post("/bookings", response_model=BookingResponse)
async def create_booking(
    booking_data: BookingCreate,
    current_user: dict = Depends(get_current_user)
):
    listing = await db.listings.find_one({"id": booking_data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["owner_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot book your own listing")
    
    # Check for conflicting bookings
    start_date = datetime.fromisoformat(booking_data.start_date)
    end_date = datetime.fromisoformat(booking_data.end_date)
    
    if end_date <= start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")
    
    conflict = await db.bookings.find_one({
        "listing_id": booking_data.listing_id,
        "status": {"$in": ["pending", "confirmed", "paid"]},
        "$or": [
            {"start_date": {"$lte": booking_data.end_date}, "end_date": {"$gte": booking_data.start_date}}
        ]
    })
    
    if conflict:
        raise HTTPException(status_code=400, detail="Dates not available")
    
    # Calculate price
    days = (end_date - start_date).days
    if days < 1:
        days = 1
    
    total_price = round(listing["price_per_day"] * days, 2)
    platform_fee = round(total_price * (PLATFORM_FEE_PERCENT / 100), 2)
    
    booking_id = str(uuid.uuid4())
    booking_doc = {
        "id": booking_id,
        "listing_id": booking_data.listing_id,
        "listing_title": listing["title"],
        "listing_image": listing["images"][0] if listing["images"] else None,
        "renter_id": current_user["id"],
        "renter_name": current_user["name"],
        "owner_id": listing["owner_id"],
        "start_date": booking_data.start_date,
        "end_date": booking_data.end_date,
        "total_price": total_price,
        "platform_fee": platform_fee,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookings.insert_one(booking_doc)
    return BookingResponse(**booking_doc)

@api_router.get("/bookings/my", response_model=List[BookingResponse])
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find(
        {"renter_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [BookingResponse(**b) for b in bookings]

@api_router.get("/bookings/requests", response_model=List[BookingResponse])
async def get_booking_requests(current_user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find(
        {"owner_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [BookingResponse(**b) for b in bookings]

@api_router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["renter_id"] != current_user["id"] and booking["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return BookingResponse(**booking)

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if status not in ["confirmed", "rejected", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": status}})
    return {"message": f"Booking {status}"}

@api_router.get("/bookings/listing/{listing_id}/dates")
async def get_booked_dates(listing_id: str):
    bookings = await db.bookings.find(
        {
            "listing_id": listing_id,
            "status": {"$in": ["pending", "confirmed", "paid"]}
        },
        {"_id": 0, "start_date": 1, "end_date": 1}
    ).to_list(100)
    
    return [{"start": b["start_date"], "end": b["end_date"]} for b in bookings]

# ============== REVIEWS ROUTES ==============

@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(
    review_data: ReviewCreate,
    current_user: dict = Depends(get_current_user)
):
    listing = await db.listings.find_one({"id": review_data.listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Check if user has a completed booking
    booking = await db.bookings.find_one({
        "listing_id": review_data.listing_id,
        "renter_id": current_user["id"],
        "status": {"$in": ["completed", "paid"]}
    })
    
    if not booking:
        raise HTTPException(status_code=400, detail="Must complete a rental to review")
    
    # Check if already reviewed
    existing = await db.reviews.find_one({
        "listing_id": review_data.listing_id,
        "reviewer_id": current_user["id"]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already reviewed this listing")
    
    review_id = str(uuid.uuid4())
    review_doc = {
        "id": review_id,
        "listing_id": review_data.listing_id,
        "reviewer_id": current_user["id"],
        "reviewer_name": current_user["name"],
        "reviewer_avatar": current_user.get("avatar_url"),
        "rating": review_data.rating,
        "comment": review_data.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update listing rating
    reviews = await db.reviews.find({"listing_id": review_data.listing_id}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    await db.listings.update_one(
        {"id": review_data.listing_id},
        {"$set": {"avg_rating": round(avg_rating, 1), "review_count": len(reviews)}}
    )
    
    return ReviewResponse(**review_doc)

@api_router.get("/reviews/listing/{listing_id}", response_model=List[ReviewResponse])
async def get_listing_reviews(listing_id: str):
    reviews = await db.reviews.find(
        {"listing_id": listing_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [ReviewResponse(**r) for r in reviews]

# ============== MESSAGES ROUTES ==============

@api_router.post("/messages", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    recipient = await db.users.find_one({"id": message_data.recipient_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    message_id = str(uuid.uuid4())
    message_doc = {
        "id": message_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "sender_avatar": current_user.get("avatar_url"),
        "recipient_id": message_data.recipient_id,
        "content": message_data.content,
        "listing_id": message_data.listing_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    return MessageResponse(**message_doc)

@api_router.get("/messages/conversations", response_model=List[ConversationResponse])
async def get_conversations(current_user: dict = Depends(get_current_user)):
    # Get all messages involving the current user
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": current_user["id"]},
            {"recipient_id": current_user["id"]}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Group by conversation partner
    conversations = {}
    for msg in messages:
        partner_id = msg["recipient_id"] if msg["sender_id"] == current_user["id"] else msg["sender_id"]
        
        if partner_id not in conversations:
            partner = await db.users.find_one({"id": partner_id}, {"_id": 0, "password": 0})
            listing = None
            if msg.get("listing_id"):
                listing = await db.listings.find_one({"id": msg["listing_id"]}, {"_id": 0})
            
            conversations[partner_id] = {
                "user_id": partner_id,
                "user_name": partner["name"] if partner else "Unknown",
                "user_avatar": partner.get("avatar_url") if partner else None,
                "last_message": msg["content"],
                "last_message_time": msg["created_at"],
                "unread_count": 0,
                "listing_id": msg.get("listing_id"),
                "listing_title": listing["title"] if listing else None
            }
        
        if msg["recipient_id"] == current_user["id"] and not msg["is_read"]:
            conversations[partner_id]["unread_count"] += 1
    
    return [ConversationResponse(**c) for c in conversations.values()]

@api_router.get("/messages/{user_id}", response_model=List[MessageResponse])
async def get_messages_with_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": current_user["id"], "recipient_id": user_id},
            {"sender_id": user_id, "recipient_id": current_user["id"]}
        ]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    # Mark messages as read
    await db.messages.update_many(
        {"sender_id": user_id, "recipient_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return [MessageResponse(**m) for m in messages]

# ============== PAYMENT ROUTES ==============

@api_router.post("/payments/checkout")
async def create_checkout(
    checkout_data: CheckoutRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    booking = await db.bookings.find_one({"id": checkout_data.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["renter_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking["status"] == "paid":
        raise HTTPException(status_code=400, detail="Booking already paid")
    
    # Build URLs from provided origin
    success_url = f"{checkout_data.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{checkout_data.origin_url}/payment/cancel"
    
    # Initialize Stripe
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=float(booking["total_price"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "booking_id": booking["id"],
            "user_id": current_user["id"],
            "platform_fee": str(booking["platform_fee"])
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction_id = str(uuid.uuid4())
    transaction_doc = {
        "id": transaction_id,
        "session_id": session.session_id,
        "booking_id": booking["id"],
        "user_id": current_user["id"],
        "amount": booking["total_price"],
        "currency": "usd",
        "platform_fee": booking["platform_fee"],
        "owner_amount": booking["total_price"] - booking["platform_fee"],
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "metadata": {
            "booking_id": booking["id"],
            "listing_id": booking["listing_id"]
        }
    }
    
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(
    session_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check Stripe status
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction and booking if payment successful
    if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": "completed",
                "payment_status": "paid"
            }}
        )
        
        await db.bookings.update_one(
            {"id": transaction["booking_id"]},
            {"$set": {"status": "paid"}}
        )
    elif checkout_status.status == "expired":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": "expired",
                "payment_status": "expired"
            }}
        )
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "amount": checkout_status.amount_total / 100,  # Convert cents to dollars
        "currency": checkout_status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            if transaction and transaction["payment_status"] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "status": "completed",
                        "payment_status": "paid"
                    }}
                )
                
                await db.bookings.update_one(
                    {"id": transaction["booking_id"]},
                    {"$set": {"status": "paid"}}
                )
                
                # Credit owner's pending payout
                booking = await db.bookings.find_one({"id": transaction["booking_id"]})
                if booking:
                    owner_amount = transaction.get("owner_amount", transaction["amount"] * 0.95)
                    await db.users.update_one(
                        {"id": booking["owner_id"]},
                        {"$inc": {"pending_payout": owner_amount, "total_earnings": owner_amount}}
                    )
                    # Create payout record
                    await db.payouts.insert_one({
                        "id": str(uuid.uuid4()),
                        "owner_id": booking["owner_id"],
                        "booking_id": booking["id"],
                        "amount": owner_amount,
                        "status": "pending",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
        
        return {"status": "ok"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"status": "error"}

# ============== IMAGE UPLOAD ==============

class ImageUpload(BaseModel):
    image_data: str  # Base64 encoded image
    filename: str

@api_router.post("/upload/image")
async def upload_image(
    upload: ImageUpload,
    current_user: dict = Depends(get_current_user)
):
    import base64
    
    # Validate image size (max 5MB)
    try:
        image_bytes = base64.b64decode(upload.image_data.split(',')[-1])
        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large (max 5MB)")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image data")
    
    # Store image in database
    image_id = str(uuid.uuid4())
    image_doc = {
        "id": image_id,
        "user_id": current_user["id"],
        "filename": upload.filename,
        "data": upload.image_data,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.images.insert_one(image_doc)
    
    # Return URL to access image
    return {"image_id": image_id, "url": f"/api/images/{image_id}"}

@api_router.get("/images/{image_id}")
async def get_image(image_id: str):
    from fastapi.responses import Response
    import base64
    
    image = await db.images.find_one({"id": image_id})
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Extract base64 data
    data = image["data"]
    if ',' in data:
        header, data = data.split(',', 1)
        content_type = header.split(':')[1].split(';')[0] if ':' in header else 'image/jpeg'
    else:
        content_type = 'image/jpeg'
    
    image_bytes = base64.b64decode(data)
    return Response(content=image_bytes, media_type=content_type)

# ============== PAYOUTS ==============

@api_router.get("/payouts/my")
async def get_my_payouts(current_user: dict = Depends(get_current_user)):
    payouts = await db.payouts.find(
        {"owner_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return payouts

@api_router.get("/payouts/summary")
async def get_payout_summary(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    # Get paid out amount
    paid_payouts = await db.payouts.find(
        {"owner_id": current_user["id"], "status": "paid"},
        {"_id": 0}
    ).to_list(1000)
    
    paid_amount = sum(p.get("amount", 0) for p in paid_payouts)
    
    return {
        "total_earnings": user.get("total_earnings", 0),
        "pending_payout": user.get("pending_payout", 0),
        "paid_out": paid_amount
    }

@api_router.post("/payouts/request")
async def request_payout(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]})
    pending = user.get("pending_payout", 0)
    
    if pending < 10:
        raise HTTPException(status_code=400, detail="Minimum payout is $10")
    
    # Create payout request
    payout_request_id = str(uuid.uuid4())
    await db.payout_requests.insert_one({
        "id": payout_request_id,
        "user_id": current_user["id"],
        "amount": pending,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Note: In production, this would trigger actual payout via Stripe Connect
    # For now, we just record the request
    
    return {
        "message": "Payout request submitted",
        "request_id": payout_request_id,
        "amount": pending,
        "note": "Payouts are processed within 3-5 business days"
    }

# ============== CATEGORIES ==============

CATEGORIES = [
    # Vehicles & Transport
    {"id": "cars", "name": "Cars", "icon": "car"},
    {"id": "motorcycles", "name": "Motorcycles & Scooters", "icon": "bike"},
    {"id": "bikes", "name": "Bikes & E-Bikes", "icon": "bicycle"},
    {"id": "boats", "name": "Boats & Watercraft", "icon": "ship"},
    {"id": "caravans", "name": "Caravans & RVs", "icon": "caravan"},
    # Heavy Equipment
    {"id": "heavy-machinery", "name": "Heavy Machinery", "icon": "tractor"},
    {"id": "construction", "name": "Construction Equipment", "icon": "hard-hat"},
    {"id": "farming", "name": "Farming Equipment", "icon": "wheat"},
    # Services & Labor
    {"id": "tradies", "name": "Tradies & Handymen", "icon": "hammer"},
    {"id": "manpower", "name": "Labor & Helpers", "icon": "users"},
    {"id": "drivers", "name": "Drivers & Delivery", "icon": "truck"},
    # Home & Living
    {"id": "tools", "name": "Tools & DIY", "icon": "wrench"},
    {"id": "kitchen", "name": "Kitchen & Appliances", "icon": "utensils"},
    {"id": "furniture", "name": "Furniture", "icon": "sofa"},
    {"id": "garden", "name": "Garden & Outdoor", "icon": "flower"},
    {"id": "cleaning", "name": "Cleaning Equipment", "icon": "sparkles"},
    # Events & Entertainment
    {"id": "party", "name": "Party & Events", "icon": "party-popper"},
    {"id": "audio-visual", "name": "Audio & Visual", "icon": "speaker"},
    {"id": "instruments", "name": "Musical Instruments", "icon": "music"},
    {"id": "photography", "name": "Photography & Video", "icon": "camera"},
    # Sports & Recreation
    {"id": "sports", "name": "Sports Equipment", "icon": "dumbbell"},
    {"id": "camping", "name": "Camping & Hiking", "icon": "tent"},
    {"id": "water-sports", "name": "Water Sports", "icon": "waves"},
    {"id": "winter-sports", "name": "Winter Sports", "icon": "snowflake"},
    # Tech & Electronics
    {"id": "electronics", "name": "Electronics & Gadgets", "icon": "laptop"},
    {"id": "gaming", "name": "Gaming", "icon": "gamepad"},
    {"id": "drones", "name": "Drones", "icon": "plane"},
    # Fashion & Accessories
    {"id": "fashion", "name": "Fashion & Costumes", "icon": "shirt"},
    {"id": "jewelry", "name": "Jewelry & Watches", "icon": "gem"},
    {"id": "bags", "name": "Bags & Luggage", "icon": "briefcase"},
    # Kids & Pets
    {"id": "baby", "name": "Baby & Kids", "icon": "baby"},
    {"id": "pets", "name": "Pet Equipment", "icon": "paw-print"},
    # Other
    {"id": "storage", "name": "Storage Space", "icon": "warehouse"},
    {"id": "other", "name": "Other", "icon": "package"}
]

@api_router.get("/categories")
async def get_categories():
    return CATEGORIES

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "RentAll API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
