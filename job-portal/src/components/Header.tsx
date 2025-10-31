import { Button } from '@/components/ui/button';
import { Menu, X, User, Briefcase, Search, Bell, Settings, Lock, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from './ChangePasswordModal';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsDropdown) {
        const target = event.target as Element;
        if (!target.closest('.settings-dropdown')) {
          console.log('Clicking outside dropdown, closing it');
          setShowSettingsDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsDropdown]);

  return (
    <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo Section */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              HireOrbit
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button 
              onClick={() => navigate('/')} 
              className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              Home
            </button>
            <button 
              onClick={() => navigate('/jobs')} 
              className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              Find Jobs
            </button>
            <a 
              href="#" 
              className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              Companies
            </a>
            <a 
              href="#" 
              className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              About
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <>
                <button 
                  onClick={() => navigate('/jobs')} 
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Search Jobs"
                >
                  <Search className="h-5 w-5" />
                </button>
                <button 
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 relative"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>
                <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">{user.username}</span>
                    <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                  </div>
                  <div className="relative settings-dropdown">
                    <button 
                      onClick={() => setShowSettingsDropdown(!showSettingsDropdown)} 
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    
                    {showSettingsDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <User className="h-4 w-4 mr-3" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            console.log('Change Password clicked!');
                            setIsChangePasswordModalOpen(true);
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Lock className="h-4 w-4 mr-3" />
                          Change Password
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="text-gray-700 border-gray-300 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-200" 
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200" 
                  onClick={() => navigate('/register')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200/50 py-4 bg-white/95 backdrop-blur-md">
            <nav className="flex flex-col space-y-2">
              <button 
                onClick={() => {navigate('/'); setIsMenuOpen(false);}} 
                className="text-left px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Home
              </button>
              <button 
                onClick={() => {navigate('/jobs'); setIsMenuOpen(false);}} 
                className="text-left px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Find Jobs
              </button>
              <a 
                href="#" 
                className="text-left px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Companies
              </a>
              <a 
                href="#" 
                className="text-left px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                About
              </a>
              
              <div className="pt-4 border-t border-gray-200/50">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-500">Job Seeker</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {navigate('/profile'); setIsMenuOpen(false);}} 
                      className="w-full text-left px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                    >
                      Profile Settings
                    </button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-gray-700 border-gray-300 hover:border-red-300 hover:text-red-600 hover:bg-red-50" 
                      onClick={() => {handleLogout(); setIsMenuOpen(false);}}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50" 
                      onClick={() => {navigate('/register'); setIsMenuOpen(false);}}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
      
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </header>
  );
};

export default Header;
