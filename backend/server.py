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
import stripe
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
stripe.api_key = STRIPE_API_KEY

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
    phone_number: Optional[str] = None
    phone_verified: bool = False
    id_verified: bool = False
    total_earnings: float = 0.0
    pending_payout: float = 0.0
    stripe_account_id: Optional[str] = None
    stripe_connected: bool = False

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
    price_per_hour: Optional[float] = None
    price_per_day: Optional[float] = None
    price_per_week: Optional[float] = None
    location: str
    latitude: float
    longitude: float
    images: List[str] = []
    damage_deposit: Optional[float] = 0.0
    min_rental_hours: Optional[int] = 1
    min_rental_days: int = 1
    max_rental_days: int = 30
    # Surge pricing
    surge_enabled: bool = False
    surge_percentage: Optional[float] = 20.0  # Default 20% surge
    surge_weekends: bool = True  # Apply surge on weekends
    surge_dates: List[str] = []  # Custom surge dates (YYYY-MM-DD)
    # Long-term discounts
    discount_weekly: Optional[float] = 0.0  # % discount for 7+ days
    discount_monthly: Optional[float] = 0.0  # % discount for 30+ days
    discount_quarterly: Optional[float] = 0.0  # % discount for 90+ days
    
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
    duration_type: str = "daily"  # "hourly", "daily", "weekly"
    hours: Optional[int] = None  # For hourly bookings

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
    duration_type: str = "daily"
    hours: Optional[int] = None
    # Surge pricing info
    surge_days: Optional[int] = 0
    surge_percentage: Optional[float] = 0
    # Discount info
    discount_applied: Optional[float] = 0
    discount_label: Optional[str] = None
    # Escrow fields
    escrow_status: Optional[str] = "held"  # held, released, refunded
    receipt_confirmed: Optional[bool] = False
    receipt_confirmed_at: Optional[str] = None
    auto_release_date: Optional[str] = None

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

# ============== STRIPE CONNECT ==============

class StripeConnectRequest(BaseModel):
    return_url: str

@api_router.post("/stripe/connect/create-account")
async def create_stripe_connect_account(
    data: StripeConnectRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe Connect account for the owner"""
    try:
        # Check if user already has a Stripe account
        if current_user.get("stripe_account_id"):
            # Create new account link for existing account
            account_link = stripe.AccountLink.create(
                account=current_user["stripe_account_id"],
                refresh_url=f"{data.return_url}?refresh=true",
                return_url=f"{data.return_url}?success=true",
                type="account_onboarding",
            )
            return {"url": account_link.url, "account_id": current_user["stripe_account_id"]}
        
        # Create new Stripe Connect Express account
        account = stripe.Account.create(
            type="express",
            country="US",
            email=current_user["email"],
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
            business_type="individual",
            metadata={
                "user_id": current_user["id"],
                "platform": "rentall"
            }
        )
        
        # Save account ID to user
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"stripe_account_id": account.id}}
        )
        
        # Create account link for onboarding
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=f"{data.return_url}?refresh=true",
            return_url=f"{data.return_url}?success=true",
            type="account_onboarding",
        )
        
        return {"url": account_link.url, "account_id": account.id}
    except stripe.error.StripeError as e:
        logging.error(f"Stripe Connect error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/stripe/connect/status")
async def get_stripe_connect_status(current_user: dict = Depends(get_current_user)):
    """Check if user's Stripe Connect account is fully set up"""
    stripe_account_id = current_user.get("stripe_account_id")
    
    if not stripe_account_id:
        return {
            "connected": False,
            "details_submitted": False,
            "charges_enabled": False,
            "payouts_enabled": False
        }
    
    try:
        account = stripe.Account.retrieve(stripe_account_id)
        
        is_connected = account.details_submitted and account.charges_enabled
        
        # Update user's stripe_connected status
        if is_connected != current_user.get("stripe_connected", False):
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"stripe_connected": is_connected}}
            )
        
        return {
            "connected": is_connected,
            "details_submitted": account.details_submitted,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
            "account_id": stripe_account_id
        }
    except stripe.error.StripeError as e:
        logging.error(f"Stripe status error: {e}")
        return {
            "connected": False,
            "error": str(e)
        }

@api_router.get("/stripe/connect/dashboard")
async def get_stripe_dashboard_link(current_user: dict = Depends(get_current_user)):
    """Get a link to the Stripe Express dashboard for the owner"""
    stripe_account_id = current_user.get("stripe_account_id")
    
    if not stripe_account_id:
        raise HTTPException(status_code=400, detail="No Stripe account connected")
    
    try:
        login_link = stripe.Account.create_login_link(stripe_account_id)
        return {"url": login_link.url}
    except stripe.error.StripeError as e:
        logging.error(f"Stripe dashboard error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

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
        "owner_verified": current_user.get("phone_verified", False),
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
    
    if end_date < start_date:
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
    
    # Calculate price based on duration type
    duration_type = booking_data.duration_type or "daily"
    hours = booking_data.hours
    days = (end_date - start_date).days or 1
    
    # Helper function to check if a date has surge pricing
    def is_surge_date(check_date: datetime) -> bool:
        if not listing.get("surge_enabled", False):
            return False
        # Check weekends
        if listing.get("surge_weekends", True) and check_date.weekday() >= 5:
            return True
        # Check custom surge dates
        surge_dates = listing.get("surge_dates", [])
        date_str = check_date.strftime("%Y-%m-%d")
        return date_str in surge_dates
    
    # Count surge days
    surge_days = 0
    if listing.get("surge_enabled", False) and duration_type in ["daily", "weekly"]:
        current = start_date
        while current < end_date:
            if is_surge_date(current):
                surge_days += 1
            current += timedelta(days=1)
    
    surge_percentage = listing.get("surge_percentage", 20.0) or 20.0
    
    if duration_type == "hourly":
        price_per_hour = listing.get("price_per_hour")
        if not price_per_hour:
            raise HTTPException(status_code=400, detail="Hourly rental not available for this listing")
        if not hours or hours < 1:
            raise HTTPException(status_code=400, detail="Hours must be specified for hourly booking")
        min_hours = listing.get("min_rental_hours", 1)
        if hours < min_hours:
            raise HTTPException(status_code=400, detail=f"Minimum {min_hours} hours required")
        base_price = price_per_hour * hours
        # Apply surge for hourly if booking date is a surge date
        if is_surge_date(start_date):
            surge_amount = base_price * (surge_percentage / 100)
            total_price = round(base_price + surge_amount, 2)
        else:
            total_price = round(base_price, 2)
    elif duration_type == "weekly":
        price_per_week = listing.get("price_per_week")
        if not price_per_week:
            raise HTTPException(status_code=400, detail="Weekly rental not available for this listing")
        weeks = max(1, days // 7)
        remaining_days = days % 7
        price_per_day = listing.get("price_per_day") or (price_per_week / 7)
        base_price = (price_per_week * weeks) + (price_per_day * remaining_days)
        # Apply surge for surge days
        if surge_days > 0:
            surge_amount = (price_per_day * surge_days) * (surge_percentage / 100)
            base_price += surge_amount
        total_price = round(base_price, 2)
    else:  # daily (default)
        price_per_day = listing.get("price_per_day")
        if not price_per_day:
            raise HTTPException(status_code=400, detail="Daily rental not available for this listing")
        if days < 1:
            days = 1
        min_days = listing.get("min_rental_days", 1)
        if days < min_days:
            raise HTTPException(status_code=400, detail=f"Minimum {min_days} days required")
        
        # Calculate base price
        normal_days = days - surge_days
        base_price = price_per_day * normal_days
        surge_price = price_per_day * surge_days * (1 + surge_percentage / 100)
        total_price = round(base_price + surge_price, 2)
    
    # Apply long-term discounts
    discount_applied = 0.0
    discount_label = None
    if days >= 90 and listing.get("discount_quarterly", 0) > 0:
        discount_applied = listing["discount_quarterly"]
        discount_label = "90+ days"
    elif days >= 30 and listing.get("discount_monthly", 0) > 0:
        discount_applied = listing["discount_monthly"]
        discount_label = "30+ days"
    elif days >= 7 and listing.get("discount_weekly", 0) > 0:
        discount_applied = listing["discount_weekly"]
        discount_label = "7+ days"
    
    if discount_applied > 0:
        discount_amount = total_price * (discount_applied / 100)
        total_price = round(total_price - discount_amount, 2)
    
    platform_fee = round(total_price * (PLATFORM_FEE_PERCENT / 100), 2)
    
    # Calculate auto-release date (3 days after rental end date)
    auto_release_date = (end_date + timedelta(days=3)).isoformat()
    
    booking_id = str(uuid.uuid4())
    booking_doc = {
        "id": booking_id,
        "listing_id": booking_data.listing_id,
        "listing_title": listing["title"],
        "listing_image": listing["images"][0] if listing.get("images") else None,
        "renter_id": current_user["id"],
        "renter_name": current_user["name"],
        "owner_id": listing["owner_id"],
        "start_date": booking_data.start_date,
        "end_date": booking_data.end_date,
        "duration_type": duration_type,
        "hours": hours,
        "surge_days": surge_days,
        "surge_percentage": surge_percentage if surge_days > 0 else 0,
        "discount_applied": discount_applied,
        "discount_label": discount_label,
        "total_price": total_price,
        "platform_fee": platform_fee,
        "status": "pending",
        # Escrow fields
        "escrow_status": "pending",  # pending -> held -> released/refunded
        "receipt_confirmed": False,
        "receipt_confirmed_at": None,
        "auto_release_date": auto_release_date,
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

@api_router.post("/bookings/{booking_id}/confirm-receipt")
async def confirm_receipt(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Renter confirms they received the item - releases escrow to owner"""
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Only renter can confirm receipt
    if booking["renter_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the renter can confirm receipt")
    
    # Must be in paid status
    if booking["status"] != "paid":
        raise HTTPException(status_code=400, detail="Booking must be paid first")
    
    # Already confirmed
    if booking.get("receipt_confirmed"):
        raise HTTPException(status_code=400, detail="Receipt already confirmed")
    
    # Update booking
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "receipt_confirmed": True,
                "receipt_confirmed_at": datetime.now(timezone.utc).isoformat(),
                "escrow_status": "released",
                "status": "completed"
            }
        }
    )
    
    # Calculate owner payout (total - platform fee)
    owner_payout = booking["total_price"] - booking["platform_fee"]
    
    # Update owner's earnings
    await db.users.update_one(
        {"id": booking["owner_id"]},
        {"$inc": {"total_earnings": owner_payout, "pending_payout": owner_payout}}
    )
    
    # If owner has Stripe Connect, trigger payout
    owner = await db.users.find_one({"id": booking["owner_id"]})
    if owner and owner.get("stripe_account_id") and owner.get("stripe_onboarding_complete"):
        try:
            # Create transfer to connected account
            transfer = stripe.Transfer.create(
                amount=int(owner_payout * 100),  # Convert to cents
                currency="usd",
                destination=owner["stripe_account_id"],
                description=f"Payout for booking {booking_id}"
            )
            logging.info(f"Stripe transfer created: {transfer.id}")
        except Exception as e:
            logging.error(f"Stripe transfer failed: {e}")
    
    return {"message": "Receipt confirmed, payment released to owner", "owner_payout": owner_payout}

@api_router.post("/bookings/{booking_id}/report-issue")
async def report_issue(
    booking_id: str,
    issue: str,
    current_user: dict = Depends(get_current_user)
):
    """Renter reports an issue with the booking"""
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["renter_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the renter can report issues")
    
    # Update booking with dispute
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "status": "disputed",
                "escrow_status": "held",
                "dispute_reason": issue,
                "dispute_date": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Issue reported. Our team will review and contact both parties."}

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

import re

def filter_contact_info(text: str) -> tuple[str, bool]:
    """Filter out phone numbers, emails, and social media handles. Returns (filtered_text, was_filtered)"""
    original = text
    
    # Phone numbers (various formats)
    phone_patterns = [
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # 123-456-7890
        r'\b\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b',   # (123) 456-7890
        r'\b\+\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b',  # +1 123 456 7890
        r'\b\d{10,11}\b',  # 1234567890
    ]
    
    # Email addresses
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    
    # Social media handles and keywords
    social_patterns = [
        r'@[A-Za-z0-9_]{3,}',  # @username
        r'\b(whatsapp|telegram|signal|venmo|cashapp|paypal|zelle)\b',
        r'\b(instagram|facebook|fb|insta|snap|snapchat|tiktok)\b',
        r'\b(call|text|dm)\s*(me|us)\b',
    ]
    
    # URLs
    url_pattern = r'https?://[^\s]+'
    
    filtered = text
    
    for pattern in phone_patterns:
        filtered = re.sub(pattern, '[phone hidden]', filtered, flags=re.IGNORECASE)
    
    filtered = re.sub(email_pattern, '[email hidden]', filtered, flags=re.IGNORECASE)
    filtered = re.sub(url_pattern, '[link hidden]', filtered, flags=re.IGNORECASE)
    
    for pattern in social_patterns:
        filtered = re.sub(pattern, '[removed]', filtered, flags=re.IGNORECASE)
    
    was_filtered = filtered != original
    return filtered, was_filtered

@api_router.post("/messages", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    recipient = await db.users.find_one({"id": message_data.recipient_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Check if there's a paid booking between these users for this listing
    has_paid_booking = False
    if message_data.listing_id:
        paid_booking = await db.bookings.find_one({
            "listing_id": message_data.listing_id,
            "status": "paid",
            "$or": [
                {"renter_id": current_user["id"], "owner_id": message_data.recipient_id},
                {"renter_id": message_data.recipient_id, "owner_id": current_user["id"]}
            ]
        })
        has_paid_booking = paid_booking is not None
    
    # Filter contact info if no paid booking
    content = message_data.content
    was_filtered = False
    if not has_paid_booking:
        content, was_filtered = filter_contact_info(content)
    
    message_id = str(uuid.uuid4())
    message_doc = {
        "id": message_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "sender_avatar": current_user.get("avatar_url"),
        "recipient_id": message_data.recipient_id,
        "content": content,
        "listing_id": message_data.listing_id,
        "is_read": False,
        "was_filtered": was_filtered,
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
    
    # Get owner's Stripe Connect account
    owner = await db.users.find_one({"id": booking["owner_id"]})
    owner_stripe_account = owner.get("stripe_account_id") if owner else None
    
    # Build URLs
    success_url = f"{checkout_data.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{checkout_data.origin_url}/payment/cancel"
    
    try:
        # Calculate amounts in cents
        total_cents = int(booking["total_price"] * 100)
        platform_fee_cents = int(booking["platform_fee"] * 100)
        
        # Create Stripe Checkout Session with Connect
        session_params = {
            "payment_method_types": ["card"],
            "line_items": [{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": total_cents,
                    "product_data": {
                        "name": booking.get("listing_title", "Rental Booking"),
                        "description": f"Rental from {booking['start_date']} to {booking['end_date']}",
                    },
                },
                "quantity": 1,
            }],
            "mode": "payment",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": {
                "booking_id": booking["id"],
                "user_id": current_user["id"],
                "owner_id": booking["owner_id"],
                "platform_fee": str(booking["platform_fee"])
            }
        }
        
        # If owner has Stripe Connect, use payment splitting
        if owner_stripe_account:
            session_params["payment_intent_data"] = {
                "application_fee_amount": platform_fee_cents,
                "transfer_data": {
                    "destination": owner_stripe_account,
                },
            }
        
        session = stripe.checkout.Session.create(**session_params)
        
        # Create payment transaction record
        transaction_id = str(uuid.uuid4())
        transaction_doc = {
            "id": transaction_id,
            "session_id": session.id,
            "booking_id": booking["id"],
            "user_id": current_user["id"],
            "owner_id": booking["owner_id"],
            "amount": booking["total_price"],
            "currency": "usd",
            "platform_fee": booking["platform_fee"],
            "owner_amount": booking["total_price"] - booking["platform_fee"],
            "owner_stripe_account": owner_stripe_account,
            "auto_payout": owner_stripe_account is not None,
            "status": "initiated",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "metadata": {
                "booking_id": booking["id"],
                "listing_id": booking["listing_id"]
            }
        }
        
        await db.payment_transactions.insert_one(transaction_doc)
        
        return {"url": session.url, "session_id": session.id}
        
    except stripe.error.StripeError as e:
        logging.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

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
    
    try:
        # Check Stripe session status directly
        session = stripe.checkout.Session.retrieve(session_id)
        
        payment_status = "pending"
        if session.payment_status == "paid":
            payment_status = "paid"
        elif session.status == "expired":
            payment_status = "expired"
        
        # Update transaction and booking if payment successful
        if payment_status == "paid" and transaction["payment_status"] != "paid":
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
            
            # If NOT auto-payout, credit owner's pending payout
            if not transaction.get("auto_payout", False):
                owner_amount = transaction.get("owner_amount", transaction["amount"] * 0.95)
                await db.users.update_one(
                    {"id": transaction.get("owner_id")},
                    {"$inc": {"pending_payout": owner_amount, "total_earnings": owner_amount}}
                )
        
        return {
            "status": session.status,
            "payment_status": payment_status,
            "amount": session.amount_total / 100 if session.amount_total else transaction["amount"],
            "currency": session.currency or "usd",
            "auto_payout": transaction.get("auto_payout", False)
        }
        
    except stripe.error.StripeError as e:
        logging.error(f"Stripe status error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

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
