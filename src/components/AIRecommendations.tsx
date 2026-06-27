import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, AlertTriangle, MapPin, TrendingUp, RefreshCw, ChevronRight } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useReports } from '../context/ReportsContext';

export const AIRecommendations = () => {
  const { reports } = useReports();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async (force = false) => {
    if (reports.length === 0) return;
    
    // Check local storage for cached insights if not forcing refresh
    const cached = localStorage.getItem('civic_guardian_insights');
    const cachedTime = localStorage.getItem('civic_guardian_insights_time');
    
    if (!force && cached && cachedTime) {
      const now = Date.now();
      const timeDiff = now - parseInt(cachedTime, 10);
      // Use cached if less than 1 hour old and we have the same amount of reports approximately
      if (timeDiff < 1000 * 60 * 60) {
        setInsights(JSON.parse(cached));
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Send only top 50 recent reports to avoid payload limit
      const recentReports = [...reports].sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
      
      const response = await fetch('/api/analyze-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: recentReports })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }

      const data = await response.json();
      setInsights(data);
      
      localStorage.setItem('civic_guardian_insights', JSON.stringify(data));
      localStorage.setItem('civic_guardian_insights_time', Date.now().toString());
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [reports.length]); // Refresh when reports count changes

  if (!reports || reports.length === 0) {
    return null;
  }

  return (
    <Card className="p-0 overflow-hidden bg-[#FDF8F5] border-black brutal-shadow-lg mb-8 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0"></div>
      
      <div className="p-5 md:p-6 border-b-2 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Lightbulb size={24} className="text-black" />
          </div>
          <div>
            <h2 className="font-black text-xl uppercase tracking-wider">AI Recommendations</h2>
            <p className="text-xs font-bold text-gray-500">Powered by Gemini</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchInsights(true)}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      <div className="p-5 md:p-6 relative z-10">
        <AnimatePresence mode="wait">
          {loading && !insights ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-gray-600 animate-pulse">Gemini is analyzing reports...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-accent/10 border-2 border-accent p-4 rounded-xl text-center"
            >
              <AlertTriangle className="mx-auto mb-2 text-accent" size={24} />
              <p className="font-bold text-accent">{error}</p>
            </motion.div>
          ) : insights ? (
            <motion.div 
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
            >
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="flex items-center gap-2 mb-2 text-accent">
                    <MapPin size={18} className="fill-accent/20" />
                    <h3 className="font-black text-sm uppercase">Most Affected Locality</h3>
                  </div>
                  <p className="font-black text-xl text-gray-800">{insights.mostAffectedLocality}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="flex items-center gap-2 mb-2 text-warning">
                    <TrendingUp size={18} />
                    <h3 className="font-black text-sm uppercase">Trending Issue</h3>
                  </div>
                  <p className="font-black text-xl text-gray-800">{insights.trendingIssue}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <AlertTriangle size={18} />
                    <h3 className="font-black text-sm uppercase">Predicted Hotspot</h3>
                  </div>
                  <p className="font-black text-xl text-gray-800">{insights.predictedFutureHotspot}</p>
                </div>
              </div>

              <div className="space-y-4 flex flex-col">
                <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-1">
                  <h3 className="font-black text-sm uppercase text-gray-500 mb-3 border-b-2 border-gray-100 pb-2">Strategic Recommendations</h3>
                  <ul className="space-y-3">
                    {insights.recommendations?.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ChevronRight size={16} className="text-primary shrink-0 mt-0.5" />
                        <span className="font-bold text-sm text-gray-700 leading-tight">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-800 text-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-black text-sm uppercase text-slate-400 mb-2">Departments to Mobilize</h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.departmentsNeedingAttention?.map((dept: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-white/10 rounded-full font-bold text-xs border border-white/20">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </Card>
  );
};
