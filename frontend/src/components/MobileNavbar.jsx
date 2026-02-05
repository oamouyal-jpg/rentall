import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MobileNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/create-listing', icon: PlusCircle, label: 'List', requiresAuth: true },
    { path: '/messages', icon: MessageSquare, label: 'Messages', requiresAuth: true },
    { path: user ? '/dashboard' : '/login', icon: User, label: user ? 'Profile' : 'Login' },
  ];

  const handleNav = (item) => {
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
          const active = isActive(item.path);
          
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
