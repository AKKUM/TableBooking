import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, LogOut, User, ChevronDown, Settings, ClipboardList, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRestaurant } from '../contexts/RestaurantContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { settings } = useRestaurant();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left - Logo */}
            <div className="flex items-center">
              <Link 
                to={user?.role === 'admin' ? '/admin' : '/'} 
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
              >
                <Calendar className="h-8 w-8" />
                <span className="text-xl font-bold">TableBook</span>
              </Link>
            </div>

            {/* Center - Restaurant Info */}
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                {settings ? (
                  <>
                    <h1 className="text-lg font-semibold text-primary-600">
                      {settings.restaurant_name}
                    </h1>
                    <p className="text-sm text-gray-600">
                      {settings.address}
                      {settings.phone && ` • Phone: ${settings.phone}`}
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-lg font-semibold text-primary-600">
                      Restaurant Name
                    </h1>
                    <p className="text-sm text-gray-600">
                      123 Main Street, City, State 12345 • Phone: (555) 123-4567
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right - User Menu */}
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600  rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                )}
                {user?.role === 'system_user' && (
                <Link
                  to="/"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600  rounded-md hover:bg-gray-100 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Table Availability
                </Link>
              )}
              </div>
            <div className="relative" ref={userMenuRef}>

              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors p-2 rounded-md hover:bg-gray-100"
              >
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <span className="text-sm font-medium">{user.full_name || user.username}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  {/* User Info */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.full_name || user.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>


                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
