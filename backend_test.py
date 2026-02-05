import requests
import sys
import json
from datetime import datetime, timedelta

class RentAllAPITester:
    def __init__(self, base_url="https://rentanything-11.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_categories(self):
        """Test categories endpoint"""
        return self.run_test("Get Categories", "GET", "categories", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "name": f"Test User {timestamp}",
            "password": "TestPass123!"
        }
        
        result = self.run_test("User Registration", "POST", "auth/register", 200, user_data)
        if result and 'token' in result:
            self.token = result['token']
            self.user_id = result['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.user_id:
            return False
            
        # Try to login with the registered user
        timestamp = datetime.now().strftime("%H%M%S")
        login_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        result = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if result and 'token' in result:
            self.token = result['token']
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        if not self.token:
            return False
        return self.run_test("Get Current User", "GET", "auth/me", 200) is not None

    def test_create_listing(self):
        """Test creating a listing"""
        if not self.token:
            return False
            
        listing_data = {
            "title": "Test Camera Rental",
            "description": "Professional DSLR camera for rent. Perfect for events and photography.",
            "category": "electronics",
            "price_per_day": 50.0,
            "location": "New York, NY",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "images": ["https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800"]
        }
        
        result = self.run_test("Create Listing", "POST", "listings", 200, listing_data)
        if result and 'id' in result:
            self.listing_id = result['id']
            return True
        return False

    def test_get_listings(self):
        """Test getting all listings"""
        return self.run_test("Get All Listings", "GET", "listings", 200) is not None

    def test_get_featured_listings(self):
        """Test getting featured listings"""
        return self.run_test("Get Featured Listings", "GET", "listings/featured", 200) is not None

    def test_get_my_listings(self):
        """Test getting user's listings"""
        if not self.token:
            return False
        return self.run_test("Get My Listings", "GET", "listings/my", 200) is not None

    def test_create_booking(self):
        """Test creating a booking"""
        if not self.token or not hasattr(self, 'listing_id'):
            return False
            
        # Create another user for booking
        timestamp = datetime.now().strftime("%H%M%S") + "2"
        user_data = {
            "email": f"test_renter_{timestamp}@example.com",
            "name": f"Test Renter {timestamp}",
            "password": "TestPass123!"
        }
        
        # Register second user
        result = self.run_test("Register Second User", "POST", "auth/register", 200, user_data)
        if not result or 'token' not in result:
            return False
            
        # Switch to second user's token
        old_token = self.token
        self.token = result['token']
        
        # Create booking
        start_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        
        booking_data = {
            "listing_id": self.listing_id,
            "start_date": start_date,
            "end_date": end_date
        }
        
        booking_result = self.run_test("Create Booking", "POST", "bookings", 200, booking_data)
        
        # Switch back to original user
        self.token = old_token
        
        if booking_result and 'id' in booking_result:
            self.booking_id = booking_result['id']
            return True
        return False

    def test_get_my_bookings(self):
        """Test getting user's bookings"""
        if not self.token:
            return False
        return self.run_test("Get My Bookings", "GET", "bookings/my", 200) is not None

    def test_get_booking_requests(self):
        """Test getting booking requests"""
        if not self.token:
            return False
        return self.run_test("Get Booking Requests", "GET", "bookings/requests", 200) is not None

    def test_send_message(self):
        """Test sending a message"""
        if not self.token or not self.user_id:
            return False
            
        # Create a test recipient (we'll use the same user for simplicity)
        message_data = {
            "recipient_id": self.user_id,
            "content": "Test message about the listing",
            "listing_id": getattr(self, 'listing_id', None)
        }
        
        return self.run_test("Send Message", "POST", "messages", 200, message_data) is not None

    def test_get_conversations(self):
        """Test getting conversations"""
        if not self.token:
            return False
        return self.run_test("Get Conversations", "GET", "messages/conversations", 200) is not None

    def test_image_upload(self):
        """Test image upload API"""
        if not self.token:
            return False
            
        # Create a simple base64 image (1x1 pixel PNG)
        base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        
        image_data = {
            "image_data": base64_image,
            "filename": "test_image.png"
        }
        
        result = self.run_test("Upload Image", "POST", "upload/image", 200, image_data)
        if result and 'image_id' in result:
            self.image_id = result['image_id']
            return True
        return False

    def test_image_retrieval(self):
        """Test image retrieval API"""
        if not hasattr(self, 'image_id'):
            return False
            
        # Test image retrieval (should return binary data, so we expect 200)
        url = f"{self.base_url}/api/images/{self.image_id}"
        try:
            response = requests.get(url, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                details += f", Content-Type: {response.headers.get('content-type', 'unknown')}"
            self.log_test("Get Image", success, details)
            return success
        except Exception as e:
            self.log_test("Get Image", False, f"Exception: {str(e)}")
            return False

    def test_payouts_summary(self):
        """Test payouts summary API"""
        if not self.token:
            return False
        return self.run_test("Get Payouts Summary", "GET", "payouts/summary", 200) is not None

    def test_my_payouts(self):
        """Test my payouts API"""
        if not self.token:
            return False
        return self.run_test("Get My Payouts", "GET", "payouts/my", 200) is not None

    def test_payout_request(self):
        """Test payout request API (should fail due to minimum amount)"""
        if not self.token:
            return False
        # This should return 400 because minimum payout is $10 and new user has $0
        result = self.run_test("Request Payout (Expected Fail)", "POST", "payouts/request", 400)
        return result is None  # We expect this to fail, so None result is success

    def test_user_fields_in_registration(self):
        """Test that registration returns new user fields"""
        timestamp = datetime.now().strftime("%H%M%S") + "fields"
        user_data = {
            "email": f"test_fields_{timestamp}@example.com",
            "name": f"Test Fields User {timestamp}",
            "password": "TestPass123!"
        }
        
        result = self.run_test("Registration with New Fields", "POST", "auth/register", 200, user_data)
        if result and 'user' in result:
            user = result['user']
            required_fields = ['phone_verified', 'id_verified', 'total_earnings', 'pending_payout']
            missing_fields = [field for field in required_fields if field not in user]
            
            if missing_fields:
                self.log_test("Check New User Fields", False, f"Missing fields: {missing_fields}")
                return False
            else:
                # Verify default values
                expected_values = {
                    'phone_verified': False,
                    'id_verified': False,
                    'total_earnings': 0.0,
                    'pending_payout': 0.0
                }
                
                for field, expected_value in expected_values.items():
                    if user[field] != expected_value:
                        self.log_test("Check New User Fields", False, f"Field {field}: expected {expected_value}, got {user[field]}")
                        return False
                
                self.log_test("Check New User Fields", True, "All new fields present with correct default values")
                return True
        
        self.log_test("Check New User Fields", False, "No user data in registration response")
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting RentAll API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)

        # Test basic endpoints
        self.test_root_endpoint()
        self.test_categories()

        # Test new user fields in registration
        self.test_user_fields_in_registration()

        # Test authentication
        if self.test_user_registration():
            self.test_get_me()
            
            # Test new image upload APIs
            if self.test_image_upload():
                self.test_image_retrieval()
            
            # Test new payout APIs
            self.test_payouts_summary()
            self.test_my_payouts()
            self.test_payout_request()
            
            # Test listings
            if self.test_create_listing():
                self.test_get_listings()
                self.test_get_featured_listings()
                self.test_get_my_listings()
                
                # Test bookings
                if self.test_create_booking():
                    self.test_get_my_bookings()
                    self.test_get_booking_requests()
                
                # Test messaging
                self.test_send_message()
                self.test_get_conversations()

        # Print summary
        print("=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run}")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = RentAllAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())