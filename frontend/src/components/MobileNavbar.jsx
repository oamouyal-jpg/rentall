import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageSquare, User, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export function MobileNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { action: 'share', icon: Share2, label: 'Share' },
    { path: '/create-listing', icon: PlusCircle, label: 'List', requiresAuth: true },
    { path: '/messages', icon: MessageSquare, label: 'Messages', requiresAuth: true },
    { path: user ? '/dashboard' : '/login', icon: User, label: user ? 'Profile' : 'Login' },
  ];

  const handleNav = async (item) => {
    if (item.action === 'share') {
      const shareData = {
        title: 'RentAll',
        text: 'Check out RentAll for peer-to-peer rentals.',
        url: window.location.origin,
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          return;
        }
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareData.url);
          toast.success('Link copied to clipboard');
          return;
        }
        toast.error('Share is not supported on this device');
      } catch (error) {
        if (error?.name !== 'AbortError') {
          toast.error('Unable to share right now');
        }
      }
      return;
    }

    if (item.requiresAuth && !user) {
      navigate('/login');
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50 pb-safe" data-testid="mobile-navbar">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.path ? isActive(item.path) : false;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                active 
                  ? 'text-coral-500' 
                  : 'text-stone-500 hover:text-stone-700'
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <Icon 
                size={24} 
                className={active ? 'text-coral-500' : ''}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-xs mt-1 ${active ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
