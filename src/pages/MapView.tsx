import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Report } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useReports } from '../context/ReportsContext';
import { MapPin, Filter, Navigation, ThumbsUp, Hash, Trash2, Edit, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { ReportService } from '../services/ReportService';
import { calculateDistance, formatDistance } from '../utils/distance';
import { getDeviceId } from '../utils/device';
import { ConfirmDialog } from '../components/ConfirmDialog';

// Component to handle auto-fitting bounds and centering
const MapController = ({ center, markers, selectedReport }: { center: {lat: number, lng: number}, markers: Report[], selectedReport: Report | null }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedReport) {
      map.setView([selectedReport.location.lat, selectedReport.location.lng], 15);
    } else if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.location.lat, m.location.lng]));
      if (center) {
        bounds.extend([center.lat, center.lng]);
      }
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([center.lat, center.lng], 12);
    }
  }, [markers, selectedReport, center, map]);

  return null;
};

export const MapView = () => {
  const { reports, loading, refreshReports } = useReports();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [center, setCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const currentUserId = auth.currentUser ? auth.currentUser.uid : getDeviceId();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        if (!selectedReport) {
          setCenter(loc);
        }
      }, () => {}, { timeout: 10000 });
    }
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const reportId = query.get('reportId');
    if (reportId && reports.length > 0) {
      const report = reports.find(r => r.id === reportId || r.reportId === reportId);
      if (report) {
        setSelectedReport(report);
        setCenter({ lat: report.location.lat, lng: report.location.lng });
        if (report.category && categories.includes(report.category)) {
          setSelectedCategory(report.category);
        } else {
          setSelectedCategory('All');
        }
      }
    }
  }, [location.search, reports]);

  const categories = ['All', 'Pothole', 'Garbage Collection', 'Water Leakage', 'Broken Streetlight', 'Road Damage', 'Infrastructure Damage', 'Public Safety Hazard'];

  const getMarkerIcon = (severity: string, status: string) => {
    let color = '#6BCB77'; // default low/resolved
    if (status !== 'Resolved' && status !== 'Closed') {
      if (severity === 'Critical') color = '#ef4444'; // Red
      else if (severity === 'High') color = '#f97316'; // Orange
      else if (severity === 'Medium') color = '#eab308'; // Yellow
    }

    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="white"></circle>
      </svg>`;

    return L.divIcon({
      className: 'bg-transparent',
      html: svgIcon,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setSelectedReport(null);
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Unable to retrieve your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleUpvote = async (report: Report) => {
    const userId = auth.currentUser ? auth.currentUser.uid : getDeviceId();
    await ReportService.toggleUpvote(report, userId);
  };

  const handleNavigate = (report: Report) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${report.location.lat},${report.location.lng}`;
    window.open(url, '_blank');
  };

  const filteredReports = reports.filter(report => {
    const matchCategory = selectedCategory === 'All' || report.category === selectedCategory;
    const matchSeverity = selectedSeverity === 'All' || report.severity === selectedSeverity;
    return matchCategory && matchSeverity;
  });

  return (
    <div className="w-full flex flex-col flex-1 min-h-[600px] items-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-7xl flex-1 relative bg-gray-100 flex flex-col brutal-border brutal-shadow-sm rounded-xl overflow-hidden">
        
        <Card className="absolute top-2 left-2 md:top-4 md:left-4 z-[400] p-3 md:p-4 max-w-[calc(100%-1rem)] md:max-w-sm shadow-none">
          <h2 className="font-black text-lg md:text-xl uppercase mb-2 md:mb-4 flex items-center justify-between gap-4">
            <span>Issue Map</span>
            <Button size="sm" variant="outline" onClick={handleCurrentLocation} className="text-xs h-8 px-2 shrink-0" title="My Location">
              <MapPin size={14} className="mr-1" /> Center
            </Button>
          </h2>
          
          <div className="flex gap-2 mb-2 md:mb-4">
            <div className="flex-1">
              <label className="text-[10px] md:text-xs font-bold uppercase text-slate-500 mb-1 flex items-center"><Filter size={12} className="mr-1"/> Category</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-1.5 md:p-2 bg-slate-50 brutal-border rounded-lg text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] md:text-xs font-bold uppercase text-slate-500 mb-1 flex items-center"><Filter size={12} className="mr-1"/> Severity</label>
              <select 
                value={selectedSeverity} 
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full p-1.5 md:p-2 bg-slate-50 brutal-border rounded-lg text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black"
              >
                {['All', 'Critical', 'High', 'Medium', 'Low'].map(sev => (
                  <option key={sev} value={sev}>{sev}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col space-y-1 md:space-y-2 hidden md:flex">
            <div className="flex items-center space-x-2"><div className="w-3 h-3 md:w-4 md:h-4 bg-red-500 brutal-border rounded-full"></div><span className="font-bold text-xs md:text-sm">Critical</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 md:w-4 md:h-4 bg-orange-500 brutal-border rounded-full"></div><span className="font-bold text-xs md:text-sm">High Priority</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-500 brutal-border rounded-full"></div><span className="font-bold text-xs md:text-sm">Medium Priority</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 brutal-border rounded-full"></div><span className="font-bold text-xs md:text-sm">Resolved / Low</span></div>
          </div>
        </Card>

        {filteredReports.length === 0 && !loading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 p-6 min-h-[400px]">
            <div className="max-w-md bg-white brutal-border brutal-shadow-sm rounded-xl p-8 flex flex-col items-center text-center gap-4 z-[400]">
              <div className="bg-gray-100 p-4 rounded-full border-2 border-black">
                <AlertCircle size={32} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-black uppercase">No Reports Found</h2>
              <p className="font-medium text-gray-600">
                There are no reports matching your current filter. Try selecting a different category or report a new issue.
              </p>
              <Button onClick={() => setSelectedCategory('All')} variant="outline" className="mt-2 font-bold w-full">
                Clear Filter
              </Button>
            </div>
          </div>
        ) : (
          <MapContainer 
            center={[center.lat, center.lng]} 
            zoom={12} 
            className="w-full h-full z-10"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController center={center} markers={filteredReports} selectedReport={selectedReport} />

            {userLoc && (
              <Marker 
                position={[userLoc.lat, userLoc.lng]}
                icon={L.divIcon({
                  className: 'bg-transparent',
                  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="8"></circle></svg>`,
                  iconSize: [24, 24]
                })}
              >
                <Popup className="font-bold text-sm">You are here</Popup>
              </Marker>
            )}

            {filteredReports.map((report) => (
              <Marker
                key={report.id}
                position={[report.location.lat, report.location.lng]}
                icon={getMarkerIcon(report.severity, report.status)}
                eventHandlers={{
                  click: () => {
                    setSelectedReport(report);
                  },
                }}
              >
                <Popup closeButton={false} className="civic-popup" minWidth={280}>
                  <div className="p-1 max-w-[280px] flex flex-col gap-3 font-sans">
                    <div className="relative">
                      <img src={report.imageUrl} alt="Issue" loading="lazy" className="w-full h-32 object-cover brutal-border rounded-lg m-0" />
                      <div className="absolute top-2 right-2 bg-white px-2 py-1 brutal-border rounded font-black text-[10px] flex items-center gap-1">
                        <Hash size={10} /> {report.reportId || report.id.slice(0, 6)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <div className="font-black text-sm uppercase">{report.category}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="default" className="text-[10px] shadow-none m-0">{report.status}</Badge>
                        <Badge className="text-[10px] shadow-none m-0" variant={report.severity === 'High' || report.severity === 'Critical' ? 'accent' : report.severity === 'Medium' ? 'warning' : 'primary'}>
                          {report.priorityScore !== undefined ? `${report.priorityScore}/10 • ` : ''}{report.severity}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] shadow-none bg-gray-100 m-0">{report.suggestedDepartment}</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-600 border-y-2 border-black/10 py-2 my-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase">Distance</span>
                        <span className="flex items-center gap-1 truncate text-accent">
                          <MapPin size={12} />
                          {userLoc ? formatDistance(calculateDistance(userLoc.lat, userLoc.lng, report.location.lat, report.location.lng)) : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase">Support</span>
                        <span className="flex items-center gap-1 text-primary">
                          <ThumbsUp size={12} /> {report.votes || 0} Upvotes
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleUpvote(report)} 
                          className="flex-1 font-black text-xs py-1 h-auto flex items-center justify-center gap-1 rounded-md"
                        >
                          <ThumbsUp size={12} /> Support
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleNavigate(report)}
                          className="flex-1 font-black text-xs py-1 h-auto flex items-center justify-center gap-1 rounded-md"
                        >
                          <Navigation size={12} /> Navigate
                        </Button>
                      </div>
                      
                      {report.userId === currentUserId && (
                        <div className="flex gap-2 pt-2 border-t-2 border-black/10 mt-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => navigate(`/report?edit=${report.id}`)}
                            className="flex-1 font-black text-xs py-1 h-auto flex items-center justify-center gap-1 bg-white text-black hover:bg-gray-100 rounded-md"
                          >
                            <Edit size={12} /> Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="accent" 
                            onClick={() => setReportToDelete(report.id)}
                            className="flex-1 font-black text-xs py-1 h-auto flex items-center justify-center gap-1 rounded-md"
                          >
                            <Trash2 size={12} /> Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <ConfirmDialog
        isOpen={reportToDelete !== null}
        title="Delete Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        onConfirm={async () => {
          if (reportToDelete) {
            try {
              await ReportService.deleteReport(reportToDelete);
              setReportToDelete(null);
              setSelectedReport(null);
              refreshReports();
            } catch (error) {
              console.error("Failed to delete report", error);
            }
          }
        }}
        onCancel={() => setReportToDelete(null)}
      />
    </div>
  );
};