"""
Test suite for Flexible Pricing Feature
Tests: hourly, daily, weekly pricing options for listings and bookings
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_USER_EMAIL = f"test_pricing_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "TestPass123!"
TEST_USER_NAME = "Test Pricing User"

# Second user for booking tests
TEST_RENTER_EMAIL = f"test_renter_{uuid.uuid4().hex[:8]}@example.com"
TEST_RENTER_PASSWORD = "RenterPass123!"
TEST_RENTER_NAME = "Test Renter User"


class TestFlexiblePricingBackend:
    """Test flexible pricing backend APIs"""
    
    @pytest.fixture(scope="class")
    def owner_session(self):
        """Create and authenticate owner user"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Register owner
        register_res = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        })
        
        if register_res.status_code == 400:
            # User exists, login instead
            login_res = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
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
        
        # Register renter
        register_res = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_RENTER_EMAIL,
            "password": TEST_RENTER_PASSWORD,
            "name": TEST_RENTER_NAME
        })
        
        if register_res.status_code == 400:
            # User exists, login instead
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
    
    # ============== LISTING CREATION TESTS ==============
    
    def test_create_listing_with_all_pricing_options(self, owner_session):
        """Test creating a listing with hourly, daily, and weekly pricing"""
        listing_data = {
            "title": "TEST_Flexible Pricing Camera",
            "description": "Professional camera with all pricing options",
            "category": "photography",
            "price_per_hour": 25.00,
            "price_per_day": 100.00,
            "price_per_week": 500.00,
            "min_rental_hours": 2,
            "min_rental_days": 1,
            "location": "New York, NY",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "images": ["https://example.com/camera.jpg"]
        }
        
        response = owner_session.post(f"{BASE_URL}/api/listings", json=listing_data)
        assert response.status_code == 200, f"Create listing failed: {response.text}"
        
        data = response.json()
        assert data["price_per_hour"] == 25.00
        assert data["price_per_day"] == 100.00
        assert data["price_per_week"] == 500.00
        assert data["min_rental_hours"] == 2
        assert data["min_rental_days"] == 1
        assert "id" in data
        
        # Store listing ID for later tests
        self.__class__.all_pricing_listing_id = data["id"]
        print(f"Created listing with all pricing: {data['id']}")
    
    def test_create_listing_hourly_only(self, owner_session):
        """Test creating a listing with only hourly pricing"""
        listing_data = {
            "title": "TEST_Hourly Only Drill",
            "description": "Power drill for hourly rental",
            "category": "tools",
            "price_per_hour": 15.00,
            "price_per_day": None,
            "price_per_week": None,
            "min_rental_hours": 1,
            "location": "Brooklyn, NY",
            "latitude": 40.6782,
            "longitude": -73.9442,
            "images": ["https://example.com/drill.jpg"]
        }
        
        response = owner_session.post(f"{BASE_URL}/api/listings", json=listing_data)
        assert response.status_code == 200, f"Create listing failed: {response.text}"
        
        data = response.json()
        assert data["price_per_hour"] == 15.00
        assert data["price_per_day"] is None
        assert data["price_per_week"] is None
        
        self.__class__.hourly_only_listing_id = data["id"]
        print(f"Created hourly-only listing: {data['id']}")
    
    def test_create_listing_daily_only(self, owner_session):
        """Test creating a listing with only daily pricing (default behavior)"""
        listing_data = {
            "title": "TEST_Daily Only Bike",
            "description": "Mountain bike for daily rental",
            "category": "bikes",
            "price_per_hour": None,
            "price_per_day": 50.00,
            "price_per_week": None,
            "min_rental_days": 1,
            "location": "Manhattan, NY",
            "latitude": 40.7831,
            "longitude": -73.9712,
            "images": ["https://example.com/bike.jpg"]
        }
        
        response = owner_session.post(f"{BASE_URL}/api/listings", json=listing_data)
        assert response.status_code == 200, f"Create listing failed: {response.text}"
        
        data = response.json()
        assert data["price_per_hour"] is None
        assert data["price_per_day"] == 50.00
        assert data["price_per_week"] is None
        
        self.__class__.daily_only_listing_id = data["id"]
        print(f"Created daily-only listing: {data['id']}")
    
    def test_create_listing_weekly_only(self, owner_session):
        """Test creating a listing with only weekly pricing"""
        listing_data = {
            "title": "TEST_Weekly Only Caravan",
            "description": "Caravan for weekly rental",
            "category": "caravans",
            "price_per_hour": None,
            "price_per_day": None,
            "price_per_week": 800.00,
            "location": "Queens, NY",
            "latitude": 40.7282,
            "longitude": -73.7949,
            "images": ["https://example.com/caravan.jpg"]
        }
        
        response = owner_session.post(f"{BASE_URL}/api/listings", json=listing_data)
        assert response.status_code == 200, f"Create listing failed: {response.text}"
        
        data = response.json()
        assert data["price_per_hour"] is None
        assert data["price_per_day"] is None
        assert data["price_per_week"] == 800.00
        
        self.__class__.weekly_only_listing_id = data["id"]
        print(f"Created weekly-only listing: {data['id']}")
    
    # ============== LISTING RETRIEVAL TESTS ==============
    
    def test_get_listing_with_flexible_pricing(self, owner_session):
        """Test retrieving a listing shows all pricing options"""
        response = owner_session.get(f"{BASE_URL}/api/listings/{self.all_pricing_listing_id}")
        assert response.status_code == 200, f"Get listing failed: {response.text}"
        
        data = response.json()
        assert data["price_per_hour"] == 25.00
        assert data["price_per_day"] == 100.00
        assert data["price_per_week"] == 500.00
        assert data["min_rental_hours"] == 2
        print(f"Retrieved listing with all pricing options")
    
    # ============== BOOKING TESTS - HOURLY ==============
    
    def test_create_hourly_booking(self, renter_session):
        """Test creating an hourly booking"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        booking_data = {
            "listing_id": self.all_pricing_listing_id,
            "start_date": tomorrow,
            "end_date": tomorrow,
            "duration_type": "hourly",
            "hours": 4
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create hourly booking failed: {response.text}"
        
        data = response.json()
        assert data["duration_type"] == "hourly"
        assert data["hours"] == 4
        # Price should be 25 * 4 = 100
        assert data["total_price"] == 100.00
        assert data["platform_fee"] == 5.00  # 5% of 100
        
        self.__class__.hourly_booking_id = data["id"]
        print(f"Created hourly booking: {data['id']}, total: ${data['total_price']}")
    
    def test_hourly_booking_minimum_hours_validation(self, renter_session):
        """Test that hourly booking respects minimum hours"""
        day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        # Try to book 1 hour when minimum is 2
        booking_data = {
            "listing_id": self.all_pricing_listing_id,
            "start_date": day_after,
            "end_date": day_after,
            "duration_type": "hourly",
            "hours": 1  # Less than min_rental_hours (2)
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 400, f"Should reject booking below minimum hours"
        assert "minimum" in response.json()["detail"].lower() or "hours" in response.json()["detail"].lower()
        print("Correctly rejected booking below minimum hours")
    
    def test_hourly_booking_on_hourly_only_listing(self, renter_session):
        """Test hourly booking on listing with only hourly pricing"""
        day_after = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        
        booking_data = {
            "listing_id": self.hourly_only_listing_id,
            "start_date": day_after,
            "end_date": day_after,
            "duration_type": "hourly",
            "hours": 3
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create hourly booking failed: {response.text}"
        
        data = response.json()
        # Price should be 15 * 3 = 45
        assert data["total_price"] == 45.00
        print(f"Created hourly booking on hourly-only listing: ${data['total_price']}")
    
    # ============== BOOKING TESTS - DAILY ==============
    
    def test_create_daily_booking(self, renter_session):
        """Test creating a daily booking"""
        start = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=13)).strftime("%Y-%m-%d")  # 3 days
        
        booking_data = {
            "listing_id": self.all_pricing_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create daily booking failed: {response.text}"
        
        data = response.json()
        assert data["duration_type"] == "daily"
        # Price should be 100 * 3 = 300
        assert data["total_price"] == 300.00
        assert data["platform_fee"] == 15.00  # 5% of 300
        
        self.__class__.daily_booking_id = data["id"]
        print(f"Created daily booking: {data['id']}, total: ${data['total_price']}")
    
    def test_daily_booking_on_daily_only_listing(self, renter_session):
        """Test daily booking on listing with only daily pricing"""
        start = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=17)).strftime("%Y-%m-%d")  # 2 days
        
        booking_data = {
            "listing_id": self.daily_only_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create daily booking failed: {response.text}"
        
        data = response.json()
        # Price should be 50 * 2 = 100
        assert data["total_price"] == 100.00
        print(f"Created daily booking on daily-only listing: ${data['total_price']}")
    
    def test_daily_booking_not_available_on_hourly_only(self, renter_session):
        """Test that daily booking fails on hourly-only listing"""
        start = (datetime.now() + timedelta(days=20)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=22)).strftime("%Y-%m-%d")
        
        booking_data = {
            "listing_id": self.hourly_only_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "daily"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 400, f"Should reject daily booking on hourly-only listing"
        assert "not available" in response.json()["detail"].lower()
        print("Correctly rejected daily booking on hourly-only listing")
    
    # ============== BOOKING TESTS - WEEKLY ==============
    
    def test_create_weekly_booking(self, renter_session):
        """Test creating a weekly booking"""
        start = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=37)).strftime("%Y-%m-%d")  # 7 days = 1 week
        
        booking_data = {
            "listing_id": self.all_pricing_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "weekly"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create weekly booking failed: {response.text}"
        
        data = response.json()
        assert data["duration_type"] == "weekly"
        # Price should be 500 for 1 week
        assert data["total_price"] == 500.00
        assert data["platform_fee"] == 25.00  # 5% of 500
        
        self.__class__.weekly_booking_id = data["id"]
        print(f"Created weekly booking: {data['id']}, total: ${data['total_price']}")
    
    def test_weekly_booking_with_extra_days(self, renter_session):
        """Test weekly booking with extra days (pro-rated)"""
        start = (datetime.now() + timedelta(days=40)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=50)).strftime("%Y-%m-%d")  # 10 days = 1 week + 3 days
        
        booking_data = {
            "listing_id": self.all_pricing_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "weekly"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create weekly booking failed: {response.text}"
        
        data = response.json()
        # Price should be 500 (1 week) + 100 * 3 (3 days at daily rate) = 800
        assert data["total_price"] == 800.00
        print(f"Created weekly booking with extra days: ${data['total_price']}")
    
    def test_weekly_booking_on_weekly_only_listing(self, renter_session):
        """Test weekly booking on listing with only weekly pricing"""
        start = (datetime.now() + timedelta(days=50)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=57)).strftime("%Y-%m-%d")  # 7 days
        
        booking_data = {
            "listing_id": self.weekly_only_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "weekly"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create weekly booking failed: {response.text}"
        
        data = response.json()
        # Price should be 800 for 1 week
        assert data["total_price"] == 800.00
        print(f"Created weekly booking on weekly-only listing: ${data['total_price']}")
    
    def test_weekly_booking_not_available_on_daily_only(self, renter_session):
        """Test that weekly booking fails on daily-only listing"""
        start = (datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=67)).strftime("%Y-%m-%d")
        
        booking_data = {
            "listing_id": self.daily_only_listing_id,
            "start_date": start,
            "end_date": end,
            "duration_type": "weekly"
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 400, f"Should reject weekly booking on daily-only listing"
        assert "not available" in response.json()["detail"].lower()
        print("Correctly rejected weekly booking on daily-only listing")
    
    # ============== BOOKING RETRIEVAL TESTS ==============
    
    def test_get_booking_shows_duration_type(self, renter_session):
        """Test that retrieved booking shows duration_type and hours"""
        response = renter_session.get(f"{BASE_URL}/api/bookings/{self.hourly_booking_id}")
        assert response.status_code == 200, f"Get booking failed: {response.text}"
        
        data = response.json()
        assert data["duration_type"] == "hourly"
        assert data["hours"] == 4
        print(f"Retrieved booking with duration_type: {data['duration_type']}, hours: {data['hours']}")
    
    def test_get_my_bookings_shows_duration_types(self, renter_session):
        """Test that my bookings list shows duration types"""
        response = renter_session.get(f"{BASE_URL}/api/bookings/my")
        assert response.status_code == 200, f"Get my bookings failed: {response.text}"
        
        data = response.json()
        assert len(data) > 0
        
        # Check that bookings have duration_type field
        for booking in data:
            assert "duration_type" in booking
            print(f"Booking {booking['id']}: {booking['duration_type']}")
    
    # ============== EDGE CASE TESTS ==============
    
    def test_hourly_booking_requires_hours(self, renter_session):
        """Test that hourly booking requires hours field"""
        day = (datetime.now() + timedelta(days=70)).strftime("%Y-%m-%d")
        
        booking_data = {
            "listing_id": self.all_pricing_listing_id,
            "start_date": day,
            "end_date": day,
            "duration_type": "hourly"
            # Missing hours field
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 400, f"Should reject hourly booking without hours"
        print("Correctly rejected hourly booking without hours")
    
    def test_default_duration_type_is_daily(self, renter_session):
        """Test that default duration_type is daily when not specified"""
        start = (datetime.now() + timedelta(days=80)).strftime("%Y-%m-%d")
        end = (datetime.now() + timedelta(days=82)).strftime("%Y-%m-%d")
        
        booking_data = {
            "listing_id": self.all_pricing_listing_id,
            "start_date": start,
            "end_date": end
            # No duration_type specified
        }
        
        response = renter_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Create booking failed: {response.text}"
        
        data = response.json()
        assert data["duration_type"] == "daily"
        print(f"Default duration_type is 'daily': {data['duration_type']}")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup(request):
    """Cleanup test data after all tests"""
    yield
    # Note: In production, we would delete TEST_ prefixed listings
    # For now, they remain for manual verification


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
