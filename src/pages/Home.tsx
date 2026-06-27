import { motion } from 'motion/react';
import { Shield, Eye, Map as MapIcon, BarChart3, ArrowRight, Zap, CheckCircle2, MessageSquare, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Eye,
      title: "AI Issue Analysis",
      description: "Upload a photo and let our AI instantly identify the problem, severity, and responsible department.",
      color: "bg-primary"
    },
    {
      icon: MapIcon,
      title: "Interactive Mapping",
      description: "See all reported issues in your community on a real-time interactive map with status tracking.",
      color: "bg-success"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Track resolution rates, identify problem hotspots, and see your community's overall trust score.",
      color: "bg-secondary"
    }
  ];

  const steps = [
    {
      title: "Snap a Photo",
      description: "See a pothole, broken streetlight, or hazard? Just take a picture with your phone.",
      icon: Zap
    },
    {
      title: "AI Processes It",
      description: "Gemini Vision analyzes the image, categorizes the issue, and flags its exact severity.",
      icon: Shield
    },
    {
      title: "City Gets Notified",
      description: "The right department receives a structured report, accelerating the repair process.",
      icon: CheckCircle2
    }
  ];

  const stats = [
    { value: "48h", label: "Avg Resolution Time", icon: Zap },
    { value: "12k+", label: "Issues Resolved", icon: CheckCircle2 },
    { value: "98%", label: "AI Accuracy", icon: Shield },
    { value: "50k", label: "Active Citizens", icon: Users },
  ];

  const testimonials = [
    {
      quote: "CivicGuardian completely changed how our neighborhood interacts with the city council. Potholes are fixed in days now, not months.",
      author: "Sarah Jenkins",
      role: "Community Leader",
      avatar: "https://i.pravatar.cc/150?img=47"
    },
    {
      quote: "The AI analysis is terrifyingly accurate. It even correctly identified a specific type of water main leak just from a puddle photo.",
      author: "Marcus Chen",
      role: "City Infrastructure Dept",
      avatar: "https://i.pravatar.cc/150?img=11"
    },
    {
      quote: "Finally, a civic app that doesn't feel like it was built in 1995. It's fast, gorgeous, and actually gets things done.",
      author: "Elena Rodriguez",
      role: "Local Resident",
      avatar: "https://i.pravatar.cc/150?img=5"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Modern Hero Section */}
      <section className="w-full bg-[#f8fafc] border-b-4 border-black relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent rounded-full blur-3xl opacity-20 -ml-20 -mb-20"></div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-24 lg:py-32 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex-1 space-y-6 md:space-y-8 z-10 text-center lg:text-left w-full"
          >
            <Badge variant="accent" className="px-4 py-1.5 text-xs md:text-sm uppercase tracking-widest border-2 border-black rotate-[-2deg] inline-block mb-2 mx-auto lg:mx-0">
              The Future of Civic Tech
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase leading-[1.1] md:leading-[1] tracking-tighter">
              Fix your <br className="hidden md:block" />
              <span className="text-white bg-black px-3 md:px-4 py-1 md:py-2 brutal-border inline-block brutal-shadow mt-2 md:mt-4">City</span> with <span className="text-accent underline decoration-4 md:decoration-8 underline-offset-4 md:underline-offset-8">AI</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-700 max-w-2xl mx-auto lg:mx-0 border-l-4 md:border-l-8 border-primary pl-4 md:pl-6 py-2 leading-snug text-left">
              Report potholes, broken lights, and safety hazards instantly. 
              Our Gemini-powered AI verifies issues and notifies the right department before you even get home.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 md:gap-6 pt-4 md:pt-6 w-full">
              <Button size="lg" onClick={() => navigate('/report')} className="w-full sm:w-auto text-lg md:text-xl brutal-shadow-lg h-14 md:h-16 px-6 md:px-8 transition-transform hover:-translate-y-1">
                <span>Report an Issue</span>
                <ArrowRight size={24} className="ml-2" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/map')} className="w-full sm:w-auto text-lg md:text-xl brutal-shadow-lg h-14 md:h-16 px-6 md:px-8 transition-transform hover:-translate-y-1 bg-white">
                <MapPin size={24} className="mr-2" />
                <span>Explore Map</span>
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.2, type: "spring" }}
            className="flex-1 w-full max-w-md md:max-w-lg lg:max-w-xl relative z-0 mt-8 lg:mt-0"
          >
            <div className="absolute inset-0 bg-accent rounded-3xl brutal-border rotate-6 brutal-shadow-lg translate-x-2 translate-y-2 md:translate-x-4 md:translate-y-4"></div>
            <div className="absolute inset-0 bg-primary rounded-3xl brutal-border -rotate-3 brutal-shadow-lg -translate-x-1 -translate-y-1 md:-translate-x-2 md:-translate-y-2"></div>
            <div className="relative bg-white p-4 md:p-6 lg:p-8 rounded-3xl brutal-border brutal-shadow-lg space-y-4 md:space-y-6">
              <div className="flex items-center justify-between border-b-2 md:border-b-4 border-black pb-3 md:pb-4">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <Shield size={24} className="text-black fill-primary md:w-8 md:h-8" />
                  <span className="text-xl md:text-2xl font-black uppercase tracking-tight">AI Analysis</span>
                </div>
                <Badge variant="success" className="px-2 md:px-3 py-1 text-[10px] md:text-sm border-2 border-black flex items-center">
                  <CheckCircle2 size={12} className="mr-1 md:w-3.5 md:h-3.5"/> Verified
                </Badge>
              </div>
              <div className="aspect-video bg-gray-200 brutal-border rounded-xl overflow-hidden relative group">
                 <img src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80" alt="Pothole" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-black/20"></div>
                 <Badge variant="default" className="absolute bottom-2 right-2 md:bottom-4 md:right-4 text-[10px] md:text-sm px-2 py-1 md:px-3 border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   98% Match
                 </Badge>
              </div>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center space-x-3 md:space-x-4 p-2 md:p-3 bg-slate-50 border-2 border-black rounded-xl">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-accent rounded-full brutal-border shrink-0"></div>
                  <div>
                    <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Classification</p>
                    <span className="font-black text-sm md:text-lg leading-tight">Severe Pothole Detected</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 md:space-x-4 p-2 md:p-3 bg-slate-50 border-2 border-black rounded-xl">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full brutal-border shrink-0"></div>
                  <div>
                     <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Action</p>
                    <span className="font-black text-sm md:text-lg leading-tight">Routing to Dept. of Transport</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="w-full py-16 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          >
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div key={idx} variants={itemVariants} className="text-center p-6 border-4 border-black rounded-2xl brutal-shadow-sm bg-[#f8fafc] hover:-translate-y-2 transition-transform">
                  <Icon size={40} className="mx-auto mb-4 text-secondary" />
                  <h3 className="text-5xl font-black mb-2">{stat.value}</h3>
                  <p className="font-bold text-gray-600 uppercase tracking-wide text-sm">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="w-full py-16 md:py-24 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <Badge variant="accent" className="mb-2">The Problem</Badge>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none">Cities are Broken. Reporting is Slow.</h2>
              <p className="text-lg md:text-xl font-bold text-gray-700 leading-relaxed">
                Traditional civic reporting is a nightmare of phone calls, clunky forms, and ignored emails. Problems stay broken for months, and citizens feel unheard.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#111827] p-8 md:p-12 rounded-3xl brutal-border shadow-[8px_8px_0px_0px_rgba(77,150,255,1)] text-white space-y-6 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary rounded-full blur-3xl opacity-30"></div>
              <Badge variant="secondary" className="mb-2 text-black bg-[#4D96FF]">The Solution</Badge>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none">CivicGuardian AI</h2>
              <p className="text-lg font-bold text-gray-300 leading-relaxed relative z-10">
                Snap a photo. Our AI automatically classifies the issue, grades the severity, and routes it to the exact right department. Real-time updates. Total transparency.
              </p>
              <div className="pt-4 flex gap-4 relative z-10">
                 <div className="flex items-center gap-2 font-bold text-sm"><CheckCircle2 className="text-success" size={16} /> Instant AI Triage</div>
                 <div className="flex items-center gap-2 font-bold text-sm"><CheckCircle2 className="text-success" size={16} /> Direct City Routing</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="w-full bg-[#111827] py-16 md:py-24 border-b-4 border-black relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10 hidden md:block">
           <div className="w-[800px] h-[800px] bg-white rounded-full absolute -top-[400px] -right-[200px] blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="text-center mb-12 md:mb-24">
            <Badge variant="primary" className="mb-4">Capabilities</Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">Supercharged Civic Tech</h2>
            <div className="w-24 md:w-32 h-2 md:h-4 bg-accent mx-auto mt-6 md:mt-8 brutal-border"></div>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8"
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={idx}
                  className="shadow-[4px_4px_0px_0px_rgba(255,217,61,1)] md:shadow-[8px_8px_0px_0px_rgba(255,217,61,1)] hover:-translate-y-2 md:hover:-translate-y-4 transition-transform duration-300 border-4 h-full flex flex-col p-6"
                >
                  <div className={`w-16 h-16 md:w-20 md:h-20 ${feature.color} brutal-border rounded-2xl flex items-center justify-center mb-6 md:mb-8 brutal-shadow-sm`}>
                    <Icon size={32} className="text-black md:w-10 md:h-10" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black mb-3 md:mb-4 uppercase leading-tight">{feature.title}</h3>
                  <p className="text-gray-700 font-bold text-base md:text-lg leading-relaxed flex-1">{feature.description}</p>
                </Card>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-24 bg-primary border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight">How it works</h2>
            <p className="text-xl font-bold mt-4 max-w-2xl mx-auto">Three simple steps to a better community.</p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-4 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-2 bg-black brutal-border z-0"></div>
            
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  viewport={{ once: true }}
                  className="flex-1 text-center relative z-10 w-full"
                >
                  <div className="w-24 h-24 mx-auto bg-white border-4 border-black rounded-full flex items-center justify-center brutal-shadow-lg mb-8 relative">
                    <Icon size={40} className="text-black" />
                    <div className="absolute -top-4 -right-4 w-10 h-10 bg-accent border-4 border-black rounded-full flex items-center justify-center font-black text-xl">
                      {idx + 1}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase bg-white inline-block px-4 py-1 border-2 border-black brutal-shadow-sm rotate-1">{step.title}</h3>
                  <p className="font-bold text-lg px-4">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-16 md:py-24 bg-[#f8fafc] border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
           <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">What People Say</h2>
            <div className="w-16 md:w-24 h-2 md:h-4 bg-secondary mx-auto mt-4 md:mt-6 brutal-border"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((test, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 md:p-8 border-4 border-black rounded-2xl brutal-shadow-sm flex flex-col relative"
              >
                <MessageSquare size={24} className="text-gray-300 absolute top-4 right-4 md:w-8 md:h-8" />
                <p className="font-bold text-base md:text-lg mb-6 md:mb-8 italic flex-1 relative z-10">"{test.quote}"</p>
                <div className="flex items-center space-x-4 border-t-2 border-black pt-4">
                  <img src={test.avatar} alt={test.author} loading="lazy" className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-black object-cover" />
                  <div>
                    <h4 className="font-black text-base md:text-lg uppercase">{test.author}</h4>
                    <p className="text-xs md:text-sm font-bold text-gray-500 uppercase">{test.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="w-full py-24 bg-accent relative overflow-hidden border-b-4 border-black">
         {/* Marquee background effect */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden whitespace-nowrap">
          <h1 className="text-[200px] font-black uppercase text-black select-none">ACT NOW ACT NOW ACT NOW</h1>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center relative z-10 space-y-6 md:space-y-8">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-black leading-none">
            Ready to fix your community?
          </h2>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 max-w-2xl mx-auto">
            Join thousands of active citizens making their cities better every single day.
          </p>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block mt-6 md:mt-8 w-full sm:w-auto"
          >
            <Button size="lg" onClick={() => navigate('/report')} className="w-full sm:w-auto text-xl md:text-2xl h-16 md:h-20 px-8 md:px-12 brutal-shadow-lg bg-black text-white hover:bg-gray-800">
              <span className="uppercase tracking-widest font-black">Start Reporting</span>
              <ArrowRight size={24} className="ml-4 md:w-8 md:h-8" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white py-12 md:py-16 border-t-[8px] md:border-t-[16px] border-black text-center relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-8">
          <div className="flex flex-col items-center lg:items-start">
            <div className="flex items-center space-x-2 md:space-x-3 mb-2">
              <Shield size={28} className="text-black fill-primary md:w-[36px] md:h-[36px]" />
              <span className="text-2xl md:text-3xl font-black tracking-tight">CivicGuardian<span className="text-secondary">.AI</span></span>
            </div>
            <p className="font-bold text-gray-500 uppercase tracking-widest text-xs md:text-sm">Empowering citizens with AI.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 md:space-x-8 font-bold uppercase tracking-wide text-xs md:text-sm">
            <a href="#" className="hover:text-primary transition-colors">About</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
          
          <div className="font-bold text-gray-400 text-xs md:text-sm">
            &copy; {new Date().getFullYear()} CivicGuardian. Built for the future.
          </div>
        </div>
      </footer>
    </div>
  );
};

