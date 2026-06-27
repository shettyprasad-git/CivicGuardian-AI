import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'motion/react';
import { Lightbulb, AlertTriangle, CheckCircle2, MapPin, Activity, Clock, ShieldAlert } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useReports } from '../context/ReportsContext';
import { calculateDistance, formatDistance } from '../utils/distance';
import { AIRecommendations } from '../components/AIRecommendations';

export const Analytics = () => {
  const { reports, loading } = useReports();
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => {}, { timeout: 10000 });
    }
  }, []);

  const stats = useMemo(() => {
    let resolved = 0;
    let open = 0;
    let critical = 0;
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    const areaCount: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};
    const deptCount: Record<string, number> = {};

    reports.forEach(r => {
      if (r.status === 'Resolved' || r.status === 'Closed') {
        resolved++;
        if (r.resolvedAt) {
          totalResolutionTime += (r.resolvedAt - r.createdAt);
          resolvedCount++;
        }
      } else {
        open++;
      }

      if (r.severity === 'Critical') {
        critical++;
      }

      if (r.locality?.area) {
        areaCount[r.locality.area] = (areaCount[r.locality.area] || 0) + 1;
      } else if (r.locality?.city) {
        areaCount[r.locality.city] = (areaCount[r.locality.city] || 0) + 1;
      }

      categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
      deptCount[r.suggestedDepartment] = (deptCount[r.suggestedDepartment] || 0) + 1;
    });

    const avgResolutionTimeHours = resolvedCount > 0 ? (totalResolutionTime / resolvedCount) / (1000 * 60 * 60) : 0;
    
    const mostAffectedArea = Object.keys(areaCount).length > 0 
      ? Object.keys(areaCount).reduce((a, b) => areaCount[a] > areaCount[b] ? a : b) 
      : 'N/A';

    const topCategories = Object.entries(categoryCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const topDepartments = Object.entries(deptCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

    const nearbyReports = reports.map(r => {
      let dist = Infinity;
      if (userLoc && r.location) {
        dist = calculateDistance(userLoc.lat, userLoc.lng, r.location.lat, r.location.lng);
      }
      return { ...r, dist };
    }).filter(r => r.dist < 10).sort((a, b) => a.dist - b.dist);

    return {
      total: reports.length,
      resolved,
      open,
      critical,
      avgResolutionTime: avgResolutionTimeHours > 24 ? `${Math.round(avgResolutionTimeHours / 24)} days` : `${Math.round(avgResolutionTimeHours)} hours`,
      mostAffectedArea,
      topCategories,
      topDepartments,
      nearbyReports
    };
  }, [reports, userLoc]);

  const COLORS = ['#FFD93D', '#4D96FF', '#6BCB77', '#FF6B6B', '#FFB703', '#9D4EDD'];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (loading) {
    return <div className="p-8 font-bold text-gray-500 text-center animate-pulse">Loading analytics...</div>;
  }

  return (
    <div className="w-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Civic Analytics</h1>
        <p className="font-bold text-gray-500 mt-1">Data-driven insights for community resilience.</p>
      </motion.div>

      <AIRecommendations />

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
      >
        <motion.div variants={item}>
          <Card className="p-4 bg-[#F8FAFC] h-full flex flex-col justify-center">
            <Activity size={24} className="mb-2 text-primary" />
            <p className="text-3xl font-black tracking-tighter">{stats.total}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Reports</p>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="p-4 bg-success/20 h-full flex flex-col justify-center border-success">
            <CheckCircle2 size={24} className="mb-2 text-success" />
            <p className="text-3xl font-black tracking-tighter text-success">{stats.resolved}</p>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Resolved</p>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="p-4 bg-warning/20 h-full flex flex-col justify-center border-warning">
            <Clock size={24} className="mb-2 text-warning" />
            <p className="text-3xl font-black tracking-tighter text-warning">{stats.open}</p>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Open</p>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-4 bg-accent/10 h-full flex flex-col justify-center border-accent">
            <ShieldAlert size={24} className="mb-2 text-accent" />
            <p className="text-3xl font-black tracking-tighter text-accent">{stats.critical}</p>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Critical</p>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="p-4 bg-[#F8FAFC] h-full flex flex-col justify-center">
            <Clock size={24} className="mb-2 text-blue-500" />
            <p className="text-xl md:text-2xl font-black tracking-tighter leading-tight">{stats.avgResolutionTime}</p>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Avg Resolution</p>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-4 bg-[#F8FAFC] h-full flex flex-col justify-center">
            <MapPin size={24} className="mb-2 text-purple-500" />
            <p className="text-sm md:text-lg font-black tracking-tight leading-tight line-clamp-2">{stats.mostAffectedArea}</p>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Most Affected</p>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
              <Activity size={24} className="text-primary" /> Top Categories
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topCategories} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: '2px solid black', fontWeight: 'bold', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }} 
                  />
                  <Bar dataKey="count" fill="#FFD93D" radius={[0, 4, 4, 0]} barSize={30}>
                    {stats.topCategories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
              <AlertTriangle size={24} className="text-accent" /> Top Departments
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topDepartments}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    stroke="#000"
                    strokeWidth={2}
                  >
                    {stats.topDepartments.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '2px solid black', fontWeight: 'bold', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }} 
                  />
                  <Legend wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="p-6 h-full">
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
              <MapPin size={24} className="text-primary" /> Nearby Reports (Within 10km)
            </h3>
            <div className="space-y-4">
              {stats.nearbyReports.length > 0 ? (
                stats.nearbyReports.slice(0, 5).map(report => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 brutal-border rounded-xl">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-slate-200 brutal-border rounded flex items-center justify-center overflow-hidden shrink-0">
                        <img src={report.imageUrl} alt={report.category} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black truncate text-sm md:text-base">{report.summary}</p>
                        <p className="text-xs font-bold text-gray-500">{report.category} • {report.locality?.formatted || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-black text-primary text-sm md:text-base">{formatDistance(report.dist)}</p>
                      <Badge variant={report.status === 'Resolved' ? 'success' : 'outline'} className="text-[10px] mt-1 shadow-none">{report.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 font-bold text-gray-500">No reports found within 10km.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="bg-secondary p-6 text-white h-full shadow-none">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center"><span className="text-secondary font-black">AI</span></div>
              <h3 className="text-xl font-black uppercase">Actionable Insights</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                <div className="flex items-start gap-3">
                  <Lightbulb size={20} className="text-[#FFD93D] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm mb-1 leading-tight">Focus resources on <span className="text-[#FFD93D]">{stats.mostAffectedArea}</span>.</p>
                    <p className="text-xs opacity-80">This area has the highest concentration of open issues this month.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-[#FF6B6B] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm mb-1 leading-tight"><span className="text-[#FF6B6B]">{stats.critical} Critical</span> issues require immediate attention.</p>
                    <p className="text-xs opacity-80">Prioritize routing these to {stats.topDepartments[0]?.name || 'relevant departments'}.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
