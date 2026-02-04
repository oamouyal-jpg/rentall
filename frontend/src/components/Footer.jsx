import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4 font-heading">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-white transition-colors">
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <a href="mailto:contact@rentall.com" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Renters */}
          <div>
            <h3 className="font-semibold text-white mb-4 font-heading">For Renters</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/search" className="hover:text-white transition-colors">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link to="/search?category=cars" className="hover:text-white transition-colors">
                  Rent a Car
                </Link>
              </li>
              <li>
                <Link to="/search?category=tools" className="hover:text-white transition-colors">
                  Rent Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Owners */}
          <div>
            <h3 className="font-semibold text-white mb-4 font-heading">For Owners</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/create-listing" className="hover:text-white transition-colors">
                  List Your Item
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  Earning Tips
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4 font-heading">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-white transition-colors">
                  Trust & Safety
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#E05D44] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg font-heading">R</span>
            </div>
            <span className="text-xl font-bold text-white font-heading">RentAll</span>
          </div>
          <p className="text-sm text-stone-400">
            © 2026 RentAll. Rent anything, anywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
