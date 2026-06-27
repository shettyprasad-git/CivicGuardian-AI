import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, Clock, MapPin, Activity, Search, Filter, ThumbsUp, X, Car, Footprints } from 'lucide-react';
import { Report } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useReports } from '../context/ReportsContext';
import { auth } from '../firebase';
import { ReportService } from '../services/ReportService';
import { calculateDistance, formatDistance, estimateWalkingTime, estimateDrivingTime } from '../utils/distance';

import { HighlightText } from '../components/HighlightText';
import { StatusTimeline } from '../components/StatusTimeline';

import { ConfirmDialog } from '../components/ConfirmDialog';
import { getDeviceId } from '../utils/device';

export const Dashboard = () => {
  const { reports, loading, refreshReports } = useReports();
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => {}, { timeout: 10000 });
    }
  }, []);

  const handleUpvote = async (report: Report) => {
    const userId = auth.currentUser ? auth.currentUser.uid : getDeviceId();
    await ReportService.toggleUpvote(report, userId);
  };

  const processedReports = useMemo(() => {
    return reports
      .filter(r => {
        const searchTerms = search.toLowerCase().split(' ').filter(t => t.trim() !== '');
        const dateStr = new Date(r.createdAt).toLocaleDateString().toLowerCase();
        
        const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
          r.reportId?.toLowerCase().includes(term) ||
          r.id.toLowerCase().includes(term) ||
          r.category.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term) ||
          r.locality?.formatted.toLowerCase().includes(term) ||
          r.suggestedDepartment.toLowerCase().includes(term) ||
          r.summary?.toLowerCase().includes(term) ||
          r.status.toLowerCase().includes(term) ||
          r.reasoning?.toLowerCase().includes(term) ||
          dateStr.includes(term)
        );
        
        const matchesCategory = filterCategory === 'All' || r.category === filterCategory;
        const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
        const matchesSeverity = filterSeverity === 'All' || r.severity === filterSeverity;

        return matchesSearch && matchesCategory && matchesStatus && matchesSeverity;
      })
      .map(r => {
        let dist = Infinity;
        if (userLoc && r.location) {
          dist = calculateDistance(userLoc.lat, userLoc.lng, r.location.lat, r.location.lng);
        }
        return { ...r, dist };
      })
      .sort((a, b) => {
        if (a.dist !== b.dist && (a.dist !== Infinity && b.dist !== Infinity)) {
          return a.dist - b.dist; // Nearest first
        }

        const severityScore = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const aScore = severityScore[a.severity] || 0;
        const bScore = severityScore[b.severity] || 0;
        
        if (aScore !== bScore) {
          return bScore - aScore; // Critical reports first
        }

        const aVotes = a.votes || 0;
        const bVotes = b.votes || 0;
        if (aVotes !== bVotes) {
          return bVotes - aVotes; // Highest upvotes next
        }
        
        return b.createdAt - a.createdAt; // Newest first
      });
  }, [reports, search, filterCategory, filterStatus, filterSeverity, userLoc]);

  const stats = useMemo(() => {
    let active = 0, resolved = 0, highPriority = 0, nearby = 0;
    processedReports.forEach(r => {
      if (r.status === 'Resolved' || r.status === 'Closed') resolved++;
      else active++;
      if (r.severity === 'High' || r.severity === 'Critical') highPriority++;
      if (userLoc && r.location) {
        if (calculateDistance(userLoc.lat, userLoc.lng, r.location.lat, r.location.lng) < 5) {
          nearby++;
        }
      }
    });
    return {
      total: processedReports.length,
      active,
      resolved,
      highPriority,
      nearby,
      score: 500 + (resolved * 10)
    };
  }, [processedReports, userLoc]);

  const categories = ['All', ...Array.from(new Set(reports.map(r => r.category)))];

  if (loading) {
    return <div className="p-8 font-bold text-gray-500 text-center animate-pulse">Loading dashboard...</div>;
  }

  const statCards = [
    { title: "Total Reports", value: stats.total, icon: Activity, color: "bg-[#FFD93D]" },
    { title: "Open Issues", value: stats.active, icon: Clock, color: "bg-[#FFB703]" },
    { title: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "bg-[#6BCB77]" },
    { title: "Critical", value: stats.highPriority, icon: AlertTriangle, color: "bg-[#FF6B6B]" },
    { title: "Nearby Issues", value: stats.nearby, icon: MapPin, color: "bg-[#4D96FF]" }
  ];

  const handleDeleteReport = async () => {
    if (reportToDelete) {
      try {
        await ReportService.deleteReport(reportToDelete);
        setReportToDelete(null);
        refreshReports();
      } catch (error) {
        console.error("Failed to delete report", error);
      }
    }
  };

  return (
    <div className="w-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search by ID, Category, Locality..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && processedReports.length > 0) {
                const target = processedReports[0];
                navigate(`/map?reportId=${target.id}`);
              }
            }}
            className="w-full pl-10 pr-4 py-3 brutal-border rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-primary transition-all"
          />
        </div>
        <Button variant={showFilters ? 'primary' : 'outline'} onClick={() => setShowFilters(!showFilters)} className="md:w-32 justify-center">
          <Filter size={20} className="mr-2" /> Filters
        </Button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <Card className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-black uppercase text-gray-500 mb-1 block">Category</label>
                <select className="w-full p-2 brutal-border rounded font-bold" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black uppercase text-gray-500 mb-1 block">Severity</label>
                <select className="w-full p-2 brutal-border rounded font-bold" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black uppercase text-gray-500 mb-1 block">Status</label>
                <select className="w-full p-2 brutal-border rounded font-bold" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Reported">Reported</option>
                  <option value="AI Verified">AI Verified</option>
                  <option value="Community Verified">Community Verified</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <Card key={i} className={`p-4 md:p-6 ${stat.color} flex flex-col justify-between items-start transition-transform hover:-translate-y-1`}>
            <stat.icon size={32} className="mb-2 md:mb-4 text-black opacity-80" />
            <div>
              <p className="text-3xl md:text-5xl font-black tracking-tighter">{stat.value}</p>
              <h3 className="font-bold text-xs md:text-sm uppercase tracking-wider">{stat.title}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Community Feed</h2>
          
          <AnimatePresence>
            {processedReports.length > 0 ? (
              processedReports.map((report) => {
                const userId = auth.currentUser ? auth.currentUser.uid : getDeviceId();
                const hasUpvoted = report.upvotedBy?.includes(userId);
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={report.id} 
                    className="bg-white brutal-border p-4 md:p-5 rounded-xl brutal-shadow-sm hover:brutal-shadow transition-shadow flex flex-col md:flex-row gap-5"
                  >
                    <div className="w-full md:w-48 h-48 md:h-auto md:aspect-[4/3] bg-slate-200 brutal-border shrink-0 rounded-lg overflow-hidden relative">
                      <img src={report.imageUrl} alt={report.category} loading="lazy" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <Badge variant={
                          report.severity === 'High' || report.severity === 'Critical' ? 'accent' : 
                          report.severity === 'Medium' ? 'warning' : 'success'
                        } className="shadow-none">
                          {report.priorityScore !== undefined ? `${report.priorityScore}/10 • ` : ''}{report.severity}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col min-w-0 py-1">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                        <div>
                          <h4 className="text-lg md:text-xl font-black leading-tight line-clamp-1 mb-1">
                            <HighlightText text={report.summary} highlight={search} />
                          </h4>
                          <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-500 uppercase items-center">
                            <Badge variant="outline" className="text-[10px] shadow-none bg-slate-100"><HighlightText text={report.reportId || report.id.slice(0,6)} highlight={search} /></Badge>
                            <span>•</span>
                            <span className="text-secondary"><HighlightText text={report.suggestedDepartment || report.category} highlight={search} /></span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative mb-3">
                        <p className="text-sm text-gray-700 font-medium line-clamp-3 leading-relaxed">
                          <HighlightText text={report.description} highlight={search} />
                        </p>
                        {report.description.length > 150 && (
                          <span className="text-xs font-bold text-primary cursor-pointer hover:underline inline-block mt-1">Read More</span>
                        )}
                      </div>

                      <div className="mb-4">
                        <StatusTimeline 
                          currentStatus={report.status} 
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-xs font-bold text-gray-600 mt-auto">
                        <div className="flex flex-col gap-1 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-primary" />
                            <span className="line-clamp-2">
                              <HighlightText text={report.locality?.formatted || 'Location captured'} highlight={search} />
                            </span>
                          </div>
                          {report.aiConfidence && (
                            <div className="flex items-center gap-1.5 text-success">
                              <CheckCircle2 size={14} />
                              <span>AI Verified ({report.aiConfidence}%)</span>
                            </div>
                          )}
                        </div>
                        {report.dist !== Infinity && (
                          <div className="flex flex-col gap-1 items-start md:items-end text-accent">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} /> {formatDistance(report.dist)} away
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              <span className="flex items-center gap-1"><Footprints size={10} /> {estimateWalkingTime(report.dist)}</span>
                              <span className="flex items-center gap-1"><Car size={10} /> {estimateDrivingTime(report.dist)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-black/5">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant={hasUpvoted ? 'primary' : 'outline'}
                            size="sm" 
                            className={`h-8 px-3 text-xs flex items-center gap-1.5 ${hasUpvoted ? 'bg-primary text-black border-black' : ''}`}
                            onClick={() => handleUpvote(report)}
                          >
                            <span>▲</span> {report.votes || 0} {report.votes === 1 ? 'Upvote' : 'Upvotes'}
                          </Button>
                          {report.status === 'Resolved' && (
                            <Button
                              variant="success"
                              size="sm"
                              className="h-8 px-3 text-xs flex items-center shadow-none"
                              onClick={async () => {
                                await ReportService.updateReport(report.id, { status: 'Closed', resolvedAt: Date.now() });
                                refreshReports();
                              }}
                            >
                              <CheckCircle2 size={14} className="mr-1" /> Close Issue
                            </Button>
                          )}
                          {report.userId === userId && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs flex items-center shadow-none"
                                onClick={() => navigate(`/report?edit=${report.id}`)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="accent"
                                size="sm"
                                className="h-8 px-3 text-xs flex items-center shadow-none"
                                onClick={() => setReportToDelete(report.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            By {report.userName}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
               <div className="text-center py-16 px-6 bg-white brutal-border brutal-shadow-sm rounded-xl flex flex-col items-center">
                 <div className="w-20 h-20 bg-gray-100 brutal-border rounded-full flex items-center justify-center mb-6">
                   <Search size={32} className="text-gray-400" />
                 </div>
                 <h3 className="text-2xl font-black uppercase mb-2">No Reports Found</h3>
                 <p className="text-sm font-medium text-gray-500 mb-6 max-w-md">
                   We couldn't find any reports matching your current search or filter criteria. Try adjusting your filters or report a new issue.
                 </p>
                 <div className="flex gap-4">
                   <Button variant="outline" onClick={() => {setSearch(''); setFilterCategory('All'); setFilterSeverity('All'); setFilterStatus('All');}}>
                     Clear Filters
                   </Button>
                   <Button onClick={() => navigate('/report')} variant="primary">
                     Report Issue
                   </Button>
                 </div>
               </div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-secondary p-6 text-white shadow-none sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center"><span className="text-secondary font-black">AI</span></div>
              <h3 className="text-xl font-black uppercase">Insights</h3>
            </div>
            
            {processedReports.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm font-bold opacity-90 leading-relaxed mb-4">
                  Based on the current view, the most pressing issue is <span className="text-[#FFD93D]">{processedReports[0].category}</span> in <span className="text-[#FFD93D]">{processedReports[0].locality?.area || 'your area'}</span>.
                </p>
                
                <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Top Department</p>
                  <p className="text-sm font-bold">{processedReports[0].suggestedDepartment}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm font-bold opacity-90">No insights available for this view.</p>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={reportToDelete !== null}
        title="Delete Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        onConfirm={handleDeleteReport}
        onCancel={() => setReportToDelete(null)}
      />
    </div>
  );
};
