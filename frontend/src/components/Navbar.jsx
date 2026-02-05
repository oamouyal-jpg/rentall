import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Search, Menu, Plus, MessageSquare, LayoutDashboard, LogOut, User } from 'lucide-react';
import { getInitials } from '../lib/utils';
import { LanguageSelector } from './LanguageSelector';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 glass-header" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 shrink-0"
            data-testid="navbar-logo"
          >
            <div className="w-8 h-8 bg-[#E05D44] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg font-heading">R</span>
            </div>
            <span className="hidden sm:block text-xl font-bold text-stone-900 font-heading">
              RentAll
            </span>
          </Link>

          {/* Search Bar */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-4"
          >
            <div className="relative w-full search-input rounded-full border border-stone-200 bg-white overflow-hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                type="text"
                placeholder={t('nav.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 h-11 border-0 focus-visible:ring-0 bg-transparent"
                data-testid="navbar-search-input"
              />
            </div>
          </form>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <LanguageSelector variant="compact" />
            
            {user ? (
              <>
                <Link to="/create-listing">
                  <Button 
                    variant="ghost" 
                    className="hidden sm:flex items-center gap-2 text-stone-700 hover:text-stone-900 hover:bg-stone-100"
                    data-testid="create-listing-btn"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t('nav.listItem')}</span>
                  </Button>
                </Link>

                <Link to="/messages">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-stone-700 hover:text-stone-900 hover:bg-stone-100"
                    data-testid="messages-btn"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-2 px-2 py-1 h-auto rounded-full border border-stone-200 hover:shadow-md transition-shadow"
                      data-testid="user-menu-trigger"
                    >
                      <Menu className="h-4 w-4 text-stone-600" />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback className="bg-[#E05D44] text-white text-sm">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium text-stone-900">{user.name}</p>
                      <p className="text-sm text-stone-500">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer" data-testid="dashboard-link">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t('common.dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/messages" className="cursor-pointer" data-testid="messages-link">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {t('common.messages')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer" data-testid="settings-link">
                        <User className="mr-2 h-4 w-4" />
                        {t('common.settings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="sm:hidden">
                      <Link to="/create-listing" className="cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('nav.listItem')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      data-testid="logout-btn"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('common.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    className="text-stone-700 hover:text-stone-900"
                    data-testid="login-btn"
                  >
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    className="bg-[#E05D44] hover:bg-[#C54E36] text-white rounded-full px-6"
                    data-testid="signup-btn"
                  >
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
