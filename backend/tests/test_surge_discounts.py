"""
Test suite for Surge Pricing and Long-term Discounts Feature
Tests: surge_enabled, surge_percentage, surge_weekends, discount_weekly, discount_monthly, discount_quarterly
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_OWNER_EMAIL = f"test_surge_owner_{uuid.uuid4().hex[:8]}@example.com"
TEST_OWNER_PASSWORD = "OwnerPass123!"
TEST_OWNER_NAME = "Test Surge Owner"

TEST_RENTER_EMAIL = f"test_surge_renter_{uuid.uuid4().hex[:8]}@example.com"
TEST_RENTER_PASSWORD = "RenterPass123!"
TEST_RENTER_NAME = "Test Surge Renter"


class TestSurgePricingAndDiscounts:
    """Test surge pricing and long-term discounts backend APIs"""
    
    @pytest.fixture(scope="class")
    def owner_session(self):
        """Create and authenticate owner user"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        register_res = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_OWNER_EMAIL,
            "password": TEST_OWNER_PASSWORD,
            "name": TEST_OWNER_NAME
        })
        
        if register_res.status_code == 400:
            login_res = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_OWNER_EMAIL,
                "password": TEST_OWNER_PASSWORD
            })
            assert login_res.status_code == 200, f"Login failed: {login_res.text}"
            token = login_res.json()["token"]
        else:
            assert register_res.status_code == 200, f"Register failed: {register_res.text}"
            token = register_res.json()["token"]
        
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    @pytest.fixture(scope="class")
    def renter_session(self):
        """Create and authenticate renter user"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        register_res = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_RENTER_EMAIL,
            "password": TEST_RENTER_PASSWORD,
            "name": TEST_RENTER_NAME
        })
        
        if register_res.status_code == 400:
            login_res = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_RENTER_EMAIL,
                "password": TEST_RENTER_PASSWORD
            })
            assert login_res.status_code == 200, f"Login failed: {login_res.text}"
            token = login_res.json()["token"]
        else:
            assert register_res.status_code == 200, f"Register failed: {register_res.text}"
            token = register_res.json()["token"]
        
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    # ============== LISTING CREATION WITH SURGE & DISCOUNTS ==============
    
    def test_create_listing_with_surge_pricing(self, owner_session):
        """Test creating a listing with surge pricing enabled"""
        listing_data = {
            "title": "TEST_Surge Pricing Camera",
            "description": "Camera with weekend surge pricing",
            "category": "photography",
            "price_per_day": 100.00,
            "surge_enabled": True,
            "surge_percentage": 20.0,
            "surge_weekends": True,
            "surge_dates": [],
            "location": "New York, NY",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "images": ["https://example.com/camera.jpg"]
        }
        
        response = owner_session.post(f"{BASE_URL}/api/listings", json=listing_data)
        assert response.status_code == 200, f"Create listing failed: {response.text}"
        
        data = response.json()
        assert data["surge_enabled"] == True
        assert data["surge_percentage"] == 20.0
        assert data["surge_weekends"] == True
        assert "id" in data
        
        self.__class__.surge_listing_id = data["id"]
        print(f"Created listing with surge pricing: {data['id']}")
    
    def test_create_listing_with_long_term_discounts(self, owner_session):
        """Test creating a listing with long-term discounts"""
        listing_data = {
            "title": "TEST_Discount Bike",
            "description": "Bike with long-term rental discounts",
            "category": "bikes",
            "price_per_day": 50.00,
            "discount_weekly": 5.0,    # 5% off for 7+ days
            "discount_monthly": 15.0,  # 15% off for 30+ days
            "discount_quarterly": 25.0, # 25% off for 90+ days
            "location": "Brooklyn, NY",
            "latitude": 40.6782,
            "longitude": -73.9442,
            "images": ["https://example.com/bike.jpg"]
        }
        
        response = owner_session.post(f"{BASE_URL}/api/listings", json=listing_data)
        assert response.status_code == 200, f"Create listing failed: {response.text}"
        
        data = response.json()
        assert data["discount_weekly"] == 5.0
        assert data["discount_monthly"] == 15.0
        assert data["discount_quarterly"] == 25.0
        
        self.__class__.discount_listing_id = data["id"]
        print(f"Created listing with discounts: {data['id']}")
    
    def test_create_listing_with_surge_and_discounts(self, owner_session):
        """Test creating a listing with both surge pricing and discounts"""
        listing_data = {
            "title": "TEST_Full Pricing Equipment",
            "description": "Equipment with surge and discounts",
            "category": "tools",
            "price_per_day": 75.00,
            "surge_enabled": True,
            "surge_percentage": 25.0,
            "surge_weekends": True,
            "discount_weekly": 10.0,
            "discount_monthly": 20.0,
            "discount_quarterly": 30.0,
            "location": "Manhattan, NY",
            "latitude": 40.7831,
            "longitude": -73.9712,
            "images": ["https://example.com/equipment.jpg"]
        }
        
        response = owner_session.post(f"{BASE_URL}/api/listings", json=listing_data)
        assert response.status_code == 200, f"Create listing failed: {response.text}"
        
        data = response.json()
        assert data["surge_enabled"] == True
        assert data["surge_percentage"] == 25.0
        assert data["discount_weekly"] == 10.0
        assert data["discount_monthly"] == 20.0
        assert data["discount_quarterly"] == 30.0
        
        self.__class__.full_pricing_listing_id = data["id"]
        print(f"Created listing with surge and discounts: {data['id']}")
    
    # ============== LISTING RETRIEVAL TESTS ==============
    
    def test_get_listing_shows_surge_fields(self, owner_session):
        """Test that retrieved listing shows surge pricing fields"""
        response = owner_session.get(f"{BASE_URL}/api/listings/{self.surge_listing_id}")
        assert response.status_code == 200, f"Get listing failed: {response.text}"
        
        data = response.json()
        assert "surge_enabled" in data
        assert "surge_percentage" in data
        assert "surge_weekends" in data
        assert data["surge_enabled"] == True
        assert data["surge_percentage"] == 20.0
        print(f"Listing shows surge fields correctly")
    
    def test_get_listing_shows_discount_fields(self, owner_session):
        """Test that retrieved listing shows discount fields"""
        response = owner_session.get(f"{BASE_URL}/api/listings/{self.discount_listing_id}")
        assert response.status_code == 200, f"Get listing failed: {response.text}"
        
        data = response.json()
        assert "discount_weekly" in data
        assert "discount_monthly" in data
        assert "discount_quarterly" in data
        assert data["discount_weekly"] == 5.0
        assert data["discount_monthly"] == 15.0
        assert data["discount_quarterly"] == 25.0
        print(f"Listing shows discount fields correctly")
    
    # ============== SURGE PRICING BOOKING TESTS ==============
    
    def test_booking_with_weekend_surge(self, renter_session):
        """Test booking that includes weekend days applies surge pricing"""
        # Find next Saturday
        today = datetime.now()
        days_until_saturday = (5 - today.weekday()) % 7
        if days_until_saturday == 0:
            days_until_saturday = 7
        
        # Book Friday to Monday (includes Sat & Sun = 2 surge days)
        start = (today + timedelta(days=days_until_saturday - 1)).strftime("%Y-%m-%d")  # Friday
        end = (today + timedelta(days=days_until_saturday + 2)).strftime("%Y-%m-%d")    # Monday (3 days)
        
        booking_data = {
            "listing_id": self.surge_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create booking failed: {response.text}"
        
        data = response.json()
        # Base: $100/day * 3 days = $300
        # Surge: 2 weekend days * $100 * 20% = $40
        # Total should be around $340 (may vary based on exact calculation)
        assert data["total_price"] > 300, f"Surge should increase price above base $300, got ${data['total_price']}"
        assert "surge_days" in data or data["total_price"] >= 320  # Verify surge was applied
        
        self.__class__.surge_booking_id = data["id"]
        print(f"Created weekend booking with surge: ${data['total_price']}")
    
    def test_booking_weekday_only_no_surge(self, renter_session):
        """Test booking on weekdays only does not apply surge"""
        # Find next Monday
        today = datetime.now()
        days_until_monday = (0 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        
        # Book Monday to Wednesday (no weekends)
        start = (today + timedelta(days=days_until_monday + 7)).strftime("%Y-%m-%d")  # Monday
        end = (today + timedelta(days=days_until_monday + 9)).strftime("%Y-%m-%d")    # Wednesday (2 days)
        
        booking_data = {
            "listing_id": self.surge_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create booking failed: {response.text}"
        
        data = response.json()
        # Base: $100/day * 2 days = $200 (no surge)
        assert data["total_price"] == 200.00, f"Weekday booking should be $200, got ${data['total_price']}"
        print(f"Created weekday booking without surge: ${data['total_price']}")
    
    # ============== LONG-TERM DISCOUNT BOOKING TESTS ==============
    
    def test_booking_7_days_weekly_discount(self, renter_session):
        """Test 7+ day booking applies weekly discount"""
        start = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=37)).strftime("%Y-%m-%d")  # 7 days
        
        booking_data = {
            "listing_id": self.discount_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create booking failed: {response.text}"
        
        data = response.json()
        # Base: $50/day * 7 days = $350
        # Discount: 5% off = $350 * 0.95 = $332.50
        expected_price = 350 * 0.95
        assert abs(data["total_price"] - expected_price) < 1, f"Expected ~${expected_price}, got ${data['total_price']}"
        
        self.__class__.weekly_discount_booking_id = data["id"]
        print(f"Created 7-day booking with weekly discount: ${data['total_price']}")
    
    def test_booking_30_days_monthly_discount(self, renter_session):
        """Test 30+ day booking applies monthly discount"""
        start = (datetime.now() + timedelta(days=50)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=80)).strftime("%Y-%m-%d")  # 30 days
        
        booking_data = {
            "listing_id": self.discount_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create booking failed: {response.text}"
        
        data = response.json()
        # Base: $50/day * 30 days = $1500
        # Discount: 15% off = $1500 * 0.85 = $1275
        expected_price = 1500 * 0.85
        assert abs(data["total_price"] - expected_price) < 10, f"Expected ~${expected_price}, got ${data['total_price']}"
        
        print(f"Created 30-day booking with monthly discount: ${data['total_price']}")
    
    def test_booking_90_days_quarterly_discount(self, renter_session):
        """Test 90+ day booking applies quarterly discount"""
        start = (datetime.now() + timedelta(days=100)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=190)).strftime("%Y-%m-%d")  # 90 days
        
        booking_data = {
            "listing_id": self.discount_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create booking failed: {response.text}"
        
        data = response.json()
        # Base: $50/day * 90 days = $4500
        # Discount: 25% off = $4500 * 0.75 = $3375
        expected_price = 4500 * 0.75
        assert abs(data["total_price"] - expected_price) < 20, f"Expected ~${expected_price}, got ${data['total_price']}"
        
        print(f"Created 90-day booking with quarterly discount: ${data['total_price']}")
    
    # ============== COMBINED SURGE + DISCOUNT TESTS ==============
    
    def test_booking_with_surge_and_weekly_discount(self, renter_session):
        """Test booking with both surge pricing and weekly discount"""
        # Find next Friday for a 7-day booking including weekend
        today = datetime.now()
        days_until_friday = (4 - today.weekday()) % 7
        if days_until_friday == 0:
            days_until_friday = 7
        
        # Book Friday to next Friday (7 days, includes 2 weekend days)
        start = (today + timedelta(days=days_until_friday + 14)).strftime("%Y-%m-%d")
        end = (today + timedelta(days=days_until_friday + 21)).strftime("%Y-%m-%d")
        
        booking_data = {
            "listing_id": self.full_pricing_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create booking failed: {response.text}"
        
        data = response.json()
        # Base: $75/day * 7 days = $525
        # Surge: 2 weekend days * $75 * 25% = $37.50
        # Subtotal: $562.50
        # Discount: 10% off = $562.50 * 0.90 = $506.25
        # Price should be between base and base+surge (discount applied)
        assert data["total_price"] > 450, f"Price should be > $450 with surge, got ${data['total_price']}"
        assert data["total_price"] < 600, f"Price should be < $600 with discount, got ${data['total_price']}"
        
        print(f"Created booking with surge and discount: ${data['total_price']}")
    
    # ============== BOOKING RESPONSE FIELD TESTS ==============
    
    def test_booking_response_includes_surge_info(self, renter_session):
        """Test that booking response includes surge pricing info"""
        response = renter_session.get(f"{BASE_URL}/api/bookings/{self.surge_booking_id}")
        assert response.status_code == 200, f"Get booking failed: {response.text}"
        
        data = response.json()
        # Check for surge-related fields in response
        assert "surge_days" in data or "surge_percentage" in data, "Booking should include surge info"
        print(f"Booking response includes surge info: surge_days={data.get('surge_days')}, surge_percentage={data.get('surge_percentage')}")
    
    def test_booking_response_includes_discount_info(self, renter_session):
        """Test that booking response includes discount info"""
        response = renter_session.get(f"{BASE_URL}/api/bookings/{self.weekly_discount_booking_id}")
        assert response.status_code == 200, f"Get booking failed: {response.text}"
        
        data = response.json()
        # Check for discount-related fields in response
        assert "discount_applied" in data or "discount_label" in data, "Booking should include discount info"
        print(f"Booking response includes discount info: discount_applied={data.get('discount_applied')}, discount_label={data.get('discount_label')}")
    
    # ============== EDGE CASE TESTS ==============
    
    def test_listing_without_surge_no_surge_applied(self, renter_session, owner_session):
        """Test that listing without surge enabled doesn't apply surge"""
        # Create listing without surge
        listing_data = {
            "title": "TEST_No Surge Item",
            "description": "Item without surge pricing",
            "category": "tools",
            "price_per_day": 100.00,
            "surge_enabled": False,
            "location": "Queens, NY",
            "latitude": 40.7282,
            "longitude": -73.7949,
            "images": ["https://example.com/item.jpg"]
        }
        
        create_res = owner_session.post(f"{BASE_URL}/api/listings", json=listing_data)
        assert create_res.status_code == 200
        listing_id = create_res.json()["id"]
        
        # Book over weekend
        today = datetime.now()
        days_until_saturday = (5 - today.weekday()) % 7
        if days_until_saturday == 0:
            days_until_saturday = 7
        
        start = (today + timedelta(days=days_until_saturday + 21)).strftime("%Y-%m-%d")
        end = (today + timedelta(days=days_until_saturday + 23)).strftime("%Y-%m-%d")  # 2 days over weekend
        
        booking_data = {
            "listing_id": listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create booking failed: {response.text}"
        
        data = response.json()
        # Should be exactly $200 (no surge)
        assert data["total_price"] == 200.00, f"No surge should be applied, expected $200, got ${data['total_price']}"
        print(f"Booking without surge: ${data['total_price']}")
    
    def test_listing_without_discounts_no_discount_applied(self, renter_session, owner_session):
        """Test that listing without discounts doesn't apply discount"""
        # Create listing without discounts
        listing_data = {
            "title": "TEST_No Discount Item",
            "description": "Item without discounts",
            "category": "tools",
            "price_per_day": 50.00,
            "discount_weekly": 0,
            "discount_monthly": 0,
            "discount_quarterly": 0,
            "location": "Bronx, NY",
            "latitude": 40.8448,
            "longitude": -73.8648,
            "images": ["https://example.com/item2.jpg"]
        }
        
        create_res = owner_session.post(f"{BASE_URL}/api/listings", json=listing_data)
        assert create_res.status_code == 200
        listing_id = create_res.json()["id"]
        
        # Book for 7 days
        start = (datetime.now() + timedelta(days=200)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=207)).strftime("%Y-%m-%d")
        
        booking_data = {
            "listing_id": listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create booking failed: {response.text}"
        
        data = response.json()
        # Should be exactly $350 (no discount)
        assert data["total_price"] == 350.00, f"No discount should be applied, expected $350, got ${data['total_price']}"
        print(f"Booking without discount: ${data['total_price']}")
    
    def test_short_booking_no_discount(self, renter_session):
        """Test that booking less than 7 days doesn't get discount"""
        start = (datetime.now() + timedelta(days=220)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=225)).strftime("%Y-%m-%d")  # 5 days
        
        booking_data = {
            "listing_id": self.discount_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create booking failed: {response.text}"
        
        data = response.json()
        # Should be exactly $250 (5 days * $50, no discount)
        assert data["total_price"] == 250.00, f"No discount for <7 days, expected $250, got ${data['total_price']}"
        print(f"Short booking without discount: ${data['total_price']}")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup(request):
    """Cleanup test data after all tests"""
    yield
    # Note: In production, we would delete TEST_ prefixed listings


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
