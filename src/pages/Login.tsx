import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Building, ArrowRight } from 'lucide-react';
import { googleSignIn } from '../firebase';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion } from 'motion/react';

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCitizenLogin = async () => {
    setLoading(true);
    try {
      await googleSignIn();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center"
      >
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-3 brutal-border rounded-xl brutal-shadow-sm">
              <Shield size={32} className="text-black" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Login to CivicGuardian</h1>
          </div>
          <p className="text-gray-700 font-bold text-lg md:text-xl max-w-md">
            Join the community to report issues, track resolutions, and make your city a better place.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 md:p-8 brutal-border brutal-shadow-sm rounded-xl flex flex-col gap-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-accent p-2 rounded brutal-border">
                <User className="text-white" />
              </div>
              <h2 className="text-2xl font-black uppercase">Citizen Portal</h2>
            </div>
            <p className="text-gray-600 font-medium">Report civic issues, track your submissions, and upvote community problems.</p>
            <Button 
              onClick={handleCitizenLogin}
              disabled={loading}
              className="w-full text-lg h-14 mt-2 group"
            >
              Continue with Google
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full text-lg h-14"
            >
              Continue as Guest
            </Button>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-gray-100 p-6 md:p-8 brutal-border brutal-shadow-sm rounded-xl flex flex-col gap-4 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 rotate-12">
              <Badge variant="warning" className="text-xs font-black px-3 py-1 border-2 border-black">COMING SOON</Badge>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary p-2 rounded brutal-border">
                <Building className="text-black" />
              </div>
              <h2 className="text-2xl font-black uppercase opacity-70">Government Portal</h2>
            </div>
            <p className="text-gray-600 font-medium opacity-70">Manage reported issues, deploy staff, and update resolutions.</p>
            
            <div className="mt-2 flex flex-wrap gap-2 opacity-60">
              {['Roads', 'Municipality', 'Electricity', 'Water', 'Police', 'Forest'].map(dept => (
                <Badge key={dept} variant="outline" className="text-[10px] font-bold border-2 shadow-none">{dept}</Badge>
              ))}
            </div>
            <Button disabled variant="outline" className="w-full text-lg h-14 mt-2 opacity-50 cursor-not-allowed">
              Authorized Login
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
