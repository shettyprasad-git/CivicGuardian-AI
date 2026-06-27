import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Home, LayoutDashboard, PlusCircle, Map, BarChart2, LogOut, MessageSquare, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { googleSignIn, initAuth, logout } from '../firebase';
import { User } from 'firebase/auth';
import { Chatbot } from './Chatbot';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export const Layout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => setUser(u),
      () => setUser(null)
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Report Issue', path: '/report', icon: PlusCircle },
    { name: 'Map View', path: '/map', icon: Map },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#FFD93D] flex flex-col">
      <nav className="h-16 brutal-border border-t-0 border-l-0 border-r-0 bg-white flex items-center justify-between px-4 lg:px-8 z-40 shrink-0 sticky top-0">
        <div className="flex items-center gap-3">
          <button 
            className="lg:hidden p-2 -ml-2 text-slate-700 hover:text-black transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary brutal-border rounded-lg flex items-center justify-center font-black text-xl shrink-0">CG</div>
            <span className="text-xl lg:text-2xl font-black tracking-tight hidden sm:block truncate">CivicGuardian AI</span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6 ml-auto">
          <div className="hidden lg:flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
            <span className="text-sm font-bold">AI Active</span>
          </div>
          {user && !user.isAnonymous ? (
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-secondary brutal-border rounded-full brutal-shadow-sm overflow-hidden flex items-center justify-center cursor-pointer hover:shadow-none transition-shadow shrink-0" onClick={handleLogout} title="Click to logout">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-bold text-white">{user.displayName?.charAt(0) || 'U'}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 md:gap-4">
              <Badge variant="default" className="hidden lg:flex px-3 py-1 text-xs whitespace-nowrap">
                <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
                Guest Mode
              </Badge>
              <Button onClick={handleLogin} variant="outline" size="sm" className="font-bold text-sm h-10 px-3 md:px-4 shrink-0">
                Sign In
              </Button>
            </div>
          )}
        </div>
      </nav>

      <div className="flex flex-1 relative">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}
        
        <aside className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 lg:w-64 
          brutal-border border-t-0 border-l-0 lg:border-b-0 bg-white 
          flex flex-col gap-2 shrink-0 overflow-y-auto 
          z-30 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          p-6
        `}>
          <div className="mb-8">
            <Button 
              onClick={() => {
                navigate('/report');
                setIsMobileMenuOpen(false);
              }}
              className="w-full font-black text-lg gap-2"
            >
              <span>+ NEW REPORT</span>
            </Button>
          </div>
          
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-3 rounded-lg font-bold flex items-center gap-3 transition-colors ${
                    isActive 
                      ? 'bg-slate-900 text-white' 
                      : 'hover:bg-slate-100 text-[#111827]'
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          <div className="mt-auto flex flex-col gap-4">
            <div className="p-4 bg-accent/10 brutal-border border-dashed">
              <p className="text-xs font-black uppercase mb-1 text-accent truncate">Trust Score</p>
              <p className="text-2xl font-black">{user && !user.isAnonymous ? '984' : '500'} <span className="text-sm font-bold">Pts</span></p>
              <div className="w-full bg-white brutal-border h-3 mt-2">
                <div className={`bg-success h-full ${user && !user.isAnonymous ? 'w-4/5' : 'w-1/2'}`}></div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 w-full flex flex-col min-w-0">
          <Outlet />
        </main>
      </div>

      <Button
        size="icon"
        variant="secondary"
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-12 h-12 md:w-14 md:h-14 rounded-full z-40 text-white brutal-shadow-lg"
      >
        <MessageSquare size={20} className="md:w-6 md:h-6" />
      </Button>

      {isChatOpen && <Chatbot onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};
