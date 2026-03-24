import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import "@/App.css";

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageNavButtons() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="border-b border-stone-200 bg-[#FAFAF9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 rounded-full border border-stone-300 text-sm text-stone-700 hover:bg-stone-100 transition-colors"
          data-testid="global-back-btn"
        >
          Back
        </button>
        <Link
          to="/"
          className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
            isHome
              ? "border-stone-200 text-stone-400 pointer-events-none"
              : "border-stone-300 text-stone-700 hover:bg-stone-100"
          }`}
          data-testid="global-home-btn"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

// Pages
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ListingPage from "./pages/ListingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CreateListingPage from "./pages/CreateListingPage";
import MessagesPage from "./pages/MessagesPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import SafetyPage from "./pages/SafetyPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import SettingsPage from "./pages/SettingsPage";
import TodayPage from "./pages/TodayPage";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { InstallPrompt } from "./components/InstallPrompt";
import { MobileNavbar } from "./components/MobileNavbar";
import { UpdatePrompt } from "./components/UpdatePrompt";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
          <Navbar />
          <PageNavButtons />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/listing/:id" element={<ListingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create-listing" element={<CreateListingPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/cancel" element={<PaymentCancelPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/safety" element={<SafetyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/today" element={<TodayPage />} />
            </Routes>
          </main>
          <Footer />
          <MobileNavbar />
          <InstallPrompt />
          <UpdatePrompt />
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: '#1C1917',
                color: '#FAFAF9',
                border: 'none',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
