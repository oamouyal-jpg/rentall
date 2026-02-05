"""
PWA Files Test Suite
Tests for Progressive Web App static files and configuration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPWAManifest:
    """Tests for PWA manifest.json file"""
    
    def test_manifest_accessible(self):
        """Manifest file should be accessible at /manifest.json"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_manifest_content_type(self):
        """Manifest should have correct content type"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        content_type = response.headers.get('content-type', '')
        assert 'application/json' in content_type or 'application/manifest+json' in content_type, \
            f"Expected JSON content type, got {content_type}"
    
    def test_manifest_required_fields(self):
        """Manifest should contain required PWA fields"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        data = response.json()
        
        # Required fields for PWA
        assert 'name' in data, "Manifest missing 'name' field"
        assert 'short_name' in data, "Manifest missing 'short_name' field"
        assert 'start_url' in data, "Manifest missing 'start_url' field"
        assert 'display' in data, "Manifest missing 'display' field"
        assert 'icons' in data, "Manifest missing 'icons' field"
        
        # Validate display mode
        assert data['display'] in ['standalone', 'fullscreen', 'minimal-ui', 'browser'], \
            f"Invalid display mode: {data['display']}"
    
    def test_manifest_icons_configuration(self):
        """Manifest should have properly configured icons"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        data = response.json()
        
        icons = data.get('icons', [])
        assert len(icons) >= 2, "Manifest should have at least 2 icons (192x192 and 512x512)"
        
        # Check for required icon sizes
        sizes = [icon.get('sizes') for icon in icons]
        assert '192x192' in sizes, "Missing 192x192 icon"
        assert '512x512' in sizes, "Missing 512x512 icon"
    
    def test_manifest_theme_color(self):
        """Manifest should have theme_color defined"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        data = response.json()
        
        assert 'theme_color' in data, "Manifest missing 'theme_color' field"
        assert data['theme_color'].startswith('#'), "theme_color should be a hex color"


class TestPWAIcons:
    """Tests for PWA icon files"""
    
    def test_icon_192_accessible(self):
        """192x192 icon should be accessible"""
        response = requests.get(f"{BASE_URL}/icon-192.png")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_icon_192_content_type(self):
        """192x192 icon should have correct content type"""
        response = requests.get(f"{BASE_URL}/icon-192.png")
        content_type = response.headers.get('content-type', '')
        assert 'image/png' in content_type, f"Expected image/png, got {content_type}"
    
    def test_icon_512_accessible(self):
        """512x512 icon should be accessible"""
        response = requests.get(f"{BASE_URL}/icon-512.png")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_icon_512_content_type(self):
        """512x512 icon should have correct content type"""
        response = requests.get(f"{BASE_URL}/icon-512.png")
        content_type = response.headers.get('content-type', '')
        assert 'image/png' in content_type, f"Expected image/png, got {content_type}"


class TestServiceWorker:
    """Tests for service worker file"""
    
    def test_service_worker_accessible(self):
        """Service worker should be accessible at /service-worker.js"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_service_worker_content_type(self):
        """Service worker should have JavaScript content type"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        content_type = response.headers.get('content-type', '')
        assert 'javascript' in content_type or 'text/plain' in content_type, \
            f"Expected JavaScript content type, got {content_type}"
    
    def test_service_worker_contains_cache_name(self):
        """Service worker should define a cache name"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        content = response.text
        assert 'CACHE_NAME' in content or 'cacheName' in content, \
            "Service worker should define a cache name"
    
    def test_service_worker_contains_install_handler(self):
        """Service worker should have install event handler"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        content = response.text
        assert "addEventListener('install'" in content or 'addEventListener("install"' in content, \
            "Service worker should have install event handler"
    
    def test_service_worker_contains_fetch_handler(self):
        """Service worker should have fetch event handler"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        content = response.text
        assert "addEventListener('fetch'" in content or 'addEventListener("fetch"' in content, \
            "Service worker should have fetch event handler"


class TestOfflinePage:
    """Tests for offline fallback page"""
    
    def test_offline_page_accessible(self):
        """Offline page should be accessible at /offline.html"""
        response = requests.get(f"{BASE_URL}/offline.html")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_offline_page_content_type(self):
        """Offline page should have HTML content type"""
        response = requests.get(f"{BASE_URL}/offline.html")
        content_type = response.headers.get('content-type', '')
        assert 'text/html' in content_type, f"Expected text/html, got {content_type}"
    
    def test_offline_page_contains_retry_button(self):
        """Offline page should have a retry/reload button"""
        response = requests.get(f"{BASE_URL}/offline.html")
        content = response.text.lower()
        assert 'reload' in content or 'retry' in content or 'try again' in content, \
            "Offline page should have a retry mechanism"


class TestHomepagePWAMeta:
    """Tests for PWA meta tags in homepage"""
    
    def test_homepage_accessible(self):
        """Homepage should be accessible"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_homepage_has_manifest_link(self):
        """Homepage should link to manifest.json"""
        response = requests.get(f"{BASE_URL}/")
        content = response.text
        assert 'manifest.json' in content, "Homepage should link to manifest.json"
    
    def test_homepage_has_theme_color_meta(self):
        """Homepage should have theme-color meta tag"""
        response = requests.get(f"{BASE_URL}/")
        content = response.text
        assert 'theme-color' in content, "Homepage should have theme-color meta tag"
    
    def test_homepage_has_apple_meta_tags(self):
        """Homepage should have Apple PWA meta tags"""
        response = requests.get(f"{BASE_URL}/")
        content = response.text
        assert 'apple-mobile-web-app-capable' in content, \
            "Homepage should have apple-mobile-web-app-capable meta tag"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
