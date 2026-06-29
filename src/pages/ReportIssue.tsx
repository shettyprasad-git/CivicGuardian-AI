import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Loader2, Sparkles, MapPin, Send, Mail, CheckCircle2, AlertCircle, RefreshCw, ImagePlus } from 'lucide-react';
import { db, auth, getAccessToken } from '../firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Report } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ReportService } from '../services/ReportService';
import { useReports } from '../context/ReportsContext';
import { reverseGeocode } from '../utils/geocoding';
import { calculateDistance, formatDistance } from '../utils/distance';
import { getDeviceId } from '../utils/device';
import { Locality } from '../types';

export const ReportIssue = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locality, setLocality] = useState<Locality | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [useEmail, setUseEmail] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Report submitted successfully!');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateReport, setDuplicateReport] = useState<Report | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { reports, refreshReports } = useReports();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Img = reader.result as string;
        setImage(base64Img);
        analyzeImage(base64Img);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setLocality(loc);
        } catch (e) {
          console.error("Geocoding failed", e);
        }
      });
    }
  };

  const analyzeImage = async (base64Img: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    try {
      const base64Data = base64Img.split(',')[1];
      const response = await fetch('/api/analyze-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Analysis request failed');
      }
      
      const data = await response.json();
      setAnalysis(data);
      setDescription(data.description || '');
      getLocation();
    } catch (error: any) {
      console.error("Analysis failed", error);
      setAnalysisError(error.message || "Unable to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retryAnalysis = () => {
    if (image) {
      analyzeImage(image);
    }
  };

  const sendEmail = async (accessToken: string, to: string, subject: string, bodyText: string) => {
    const emailLines = [];
    emailLines.push(`To: ${to}`);
    emailLines.push('Content-type: text/html;charset=utf-8');
    emailLines.push('MIME-Version: 1.0');
    emailLines.push(`Subject: ${subject}`);
    emailLines.push('');
    emailLines.push(bodyText);

    const email = emailLines.join('\r\n').trim();
    const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64EncodedEmail }),
    });
  };

  const checkDuplicateAndSubmit = () => {
    if (!analysis || !location) {
      executeSubmit();
      return;
    }

    let possibleDuplicate: Report | null = null;
    let maxConfidence = 0;

    for (const report of reports) {
      if (report.status === 'Resolved' || report.status === 'Closed') continue;
      
      if (report.category === analysis.category && report.location) {
        const distance = calculateDistance(location.lat, location.lng, report.location.lat, report.location.lng);
        
        if (distance <= 0.25) {
          let confidence = 90 - (distance * 100); 
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            possibleDuplicate = report;
          }
        }
      }
    }

    if (possibleDuplicate && maxConfidence > 80) {
      setDuplicateReport(possibleDuplicate);
      setShowDuplicateModal(true);
    } else {
      executeSubmit();
    }
  };

  const handleSupportExisting = async () => {
    if (duplicateReport) {
      setIsSubmitting(true);
      const user = auth.currentUser;
      const userId = user ? user.uid : getDeviceId();
      
      const upvotedBy = duplicateReport.upvotedBy || [];
      if (!upvotedBy.includes(userId)) {
        await ReportService.updateReport(duplicateReport.id, {
          upvotedBy: [...upvotedBy, userId],
          votes: (duplicateReport.votes || 0) + 1
        });
      }
      
      setIsSubmitting(false);
      setShowDuplicateModal(false);
      setToastMessage("Community support added.");
      setShowToast(true);
      
      setTimeout(() => {
        setShowToast(false);
        navigate('/dashboard');
      }, 2000);
    }
  };

  const executeSubmit = async () => {
    if (!analysis || !image) return;
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      const guestId = getDeviceId();
      
      const confidenceMatch = analysis.confidence ? analysis.confidence.toString().match(/\d+/) : null;
      const confidenceNum = confidenceMatch ? parseInt(confidenceMatch[0], 10) : 0;

      const reportData: any = {
        userId: user ? user.uid : guestId,
        userName: user ? (user.displayName || 'Anonymous') : 'Guest User',
        userPhoto: user ? (user.photoURL || '') : '',
        category: analysis.category || 'Unknown',
        severity: analysis.severity || 'Medium',
        status: 'Reported',
        suggestedDepartment: analysis.department || 'General',
        suggestedPriority: analysis.severity === 'Critical' || analysis.severity === 'High' ? 'High' : 'Medium',
        summary: analysis.category ? `${analysis.category} Issue` : 'Civic Issue',
        description: description,
        impact: '',
        action: analysis.recommendedAction || '',
        location: location || { lat: 0, lng: 0 },
        locality: locality,
        imageUrl: image,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        votes: 1,
        upvotedBy: user ? [user.uid] : [guestId],
        aiConfidence: confidenceNum,
        priorityScore: analysis.priorityScore !== undefined ? analysis.priorityScore : analysis.severityScore,
        reasoning: analysis.reasoning || analysis.severityReason
      };

      try {
        await ReportService.createReport(reportData);
      } catch (dbError) {
        console.warn("Database write failed:", dbError);
      }

      if (useEmail && user && user.email) {
        try {
          const token = await getAccessToken();
          if (token) {
            const emailBody = `
              <h2>Civic Issue Reported Successfully!</h2>
              <p>Thank you for reporting this issue. Here are the details:</p>
              <ul>
                <li><strong>Category:</strong> ${reportData.category}</li>
                <li><strong>Severity:</strong> ${reportData.severity}</li>
                <li><strong>Description:</strong> ${reportData.description}</li>
              </ul>
              <p>The issue has been routed to the ${reportData.suggestedDepartment} for review.</p>
              <p>You can track the status in the CivicGuardian AI dashboard.</p>
            `;
            await sendEmail(token, user.email, 'CivicGuardian AI - Issue Reported', emailBody);
          }
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
        }
      }
      
      refreshReports();
      setToastMessage('Report submitted successfully!');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error("Submit error", error);
      alert("Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setImage(null);
    setAnalysis(null);
    setAnalysisError(null);
    setLocation(null);
    setDescription('');
  };

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="w-full bg-[#F8FAFC] pb-12">
      <div className="max-w-[1500px] mx-auto w-full px-4 sm:px-6 min-[1200px]:px-12 py-6 md:py-12">
        <div className="w-full min-[1200px]:grid min-[1200px]:grid-cols-[minmax(680px,1fr)_460px] min-[1200px]:gap-8 min-[1200px]:items-start flex flex-col gap-6">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6 w-full">
            <div className="mb-2 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Report Issue</h1>
              <p className="font-bold text-gray-500 mt-2">AI-Powered Civic Reporting</p>
            </div>

            {/* Image Upload Card */}
            <Card className="p-6 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {!image ? (
                  <motion.div 
                    key="upload-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="brutal-border border-dashed bg-[#F8FAFC] rounded-xl p-12 md:p-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group min-h-[300px]"
                  >
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform brutal-border">
                      <ImagePlus size={36} className="text-primary" />
                    </div>
                    <h3 className="font-black text-xl md:text-2xl mb-2 text-center">Upload Evidence</h3>
                    <p className="font-bold text-gray-500 text-center max-w-xs">Upload a photo to begin AI analysis.</p>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="upload-preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative group"
                  >
                    <img src={image} alt="Upload" className="w-full h-[300px] md:h-[400px] object-cover brutal-border rounded-xl" />
                    <button 
                      onClick={resetFlow}
                      className="absolute -top-3 -right-3 bg-accent text-white p-2 md:p-3 brutal-border rounded-full brutal-shadow-sm hover:scale-110 transition-transform z-10"
                    >
                      <X size={20} />
                    </button>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center pointer-events-none">
                      <Button variant="primary" className="pointer-events-auto" onClick={() => fileInputRef.current?.click()}>
                        <RefreshCw size={16} className="mr-2" /> Replace Photo
                      </Button>
                    </div>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Location Card (Always visible to prevent column jump/shift) */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
                  <MapPin size={20} /> Location
                </h2>
                {!location && (
                  <Button onClick={getLocation} size="sm" variant="outline">
                    Capture Location
                  </Button>
                )}
              </div>
              
              {location ? (
                <div className="p-4 bg-success/20 border-2 border-black rounded-xl font-bold flex flex-col space-y-2">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 size={24} className="text-success shrink-0" />
                    <span className="text-sm md:text-base break-all">
                      {locality ? locality.formatted : `Verified (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-100 border-2 border-black rounded-xl font-bold text-gray-500 text-sm">
                  Location required for submission.
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN (Sticky AI Report Panel) */}
          <div className="w-full min-[1200px]:sticky min-[1200px]:top-[100px] flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {!image ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white brutal-border rounded-2xl brutal-shadow-lg overflow-hidden flex flex-col min-h-[500px]"
                >
                  <div className="bg-black text-white p-4 md:p-5 flex items-center space-x-3 shrink-0">
                    <Sparkles size={24} className="text-primary" />
                    <h2 className="font-black text-lg md:text-xl uppercase tracking-widest">AI Report</h2>
                  </div>
                  <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-6">
                    <div className="w-24 h-24 bg-slate-100 rounded-full border-4 border-black border-dashed flex items-center justify-center animate-pulse">
                      <Sparkles size={40} className="text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl uppercase mb-2">AI report will appear here</h3>
                      <p className="font-bold text-sm text-gray-500 max-w-xs">
                        Upload an image to begin analysis of the civic issue and route it to the correct department automatically.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 md:p-6 bg-slate-50 border-t-2 border-black shrink-0">
                    <Button 
                      variant="success"
                      disabled={true}
                      className="w-full py-4 md:py-6 text-lg md:text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-50 cursor-not-allowed"
                    >
                      <Send size={24} className="mr-3" /> Submit Official Report
                    </Button>
                  </div>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white brutal-border rounded-2xl brutal-shadow-lg overflow-hidden flex flex-col min-h-[500px]"
                >
                  <div className="bg-black text-white p-4 md:p-5 flex items-center space-x-3 shrink-0">
                    <Sparkles size={24} className="text-primary animate-spin" style={{ animationDuration: '3s' }} />
                    <h2 className="font-black text-lg md:text-xl uppercase tracking-widest">Analyzing with Gemini</h2>
                  </div>
                  
                  <div className="p-4 md:p-6 space-y-6 flex-1">
                    {/* 4 grid items skeleton */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="p-3 border-2 border-black rounded-xl bg-slate-50 animate-pulse h-16 flex flex-col justify-between">
                          <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                          <div className="h-4 bg-slate-300 rounded w-5/6"></div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Priority Score Box skeleton */}
                    <div className="p-4 border-2 border-black rounded-xl bg-slate-50 animate-pulse space-y-3">
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 bg-slate-300 rounded w-20"></div>
                        <div className="h-8 bg-slate-300 rounded w-16"></div>
                      </div>
                      <div className="h-12 bg-slate-200 rounded w-full"></div>
                    </div>

                    {/* Description skeleton */}
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                      <div className="space-y-1.5">
                        <div className="h-4 bg-slate-300 rounded w-full"></div>
                        <div className="h-4 bg-slate-300 rounded w-11/12"></div>
                        <div className="h-4 bg-slate-300 rounded w-4/5"></div>
                      </div>
                    </div>

                    {/* Action Plan skeleton */}
                    <div className="p-4 bg-primary/5 border-2 border-black rounded-xl animate-pulse space-y-3">
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                      <div className="h-4 bg-slate-300 rounded w-full"></div>
                      <div className="h-4 bg-slate-300 rounded w-5/6"></div>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 bg-slate-50 border-t-2 border-black shrink-0">
                    <Button 
                      variant="success"
                      disabled={true}
                      className="w-full py-4 md:py-6 text-lg md:text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-50 cursor-not-allowed"
                    >
                      <Loader2 size={24} className="animate-spin mr-3" /> Analyzing...
                    </Button>
                  </div>
                </motion.div>
              ) : analysisError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white brutal-border rounded-2xl brutal-shadow-lg overflow-hidden flex flex-col min-h-[500px]"
                >
                  <div className="bg-black text-white p-4 md:p-5 flex items-center space-x-3 shrink-0">
                    <Sparkles size={24} className="text-primary" />
                    <h2 className="font-black text-lg md:text-xl uppercase tracking-widest">AI Report</h2>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-6">
                    <div className="w-16 h-16 bg-red-100 p-3 rounded-full border-4 border-black flex items-center justify-center">
                      <AlertCircle size={32} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl uppercase mb-2">Analysis Failed</h3>
                      <p className="font-bold text-sm text-gray-500 max-w-xs mb-4">
                        {analysisError || "Unable to analyze image. Please try again."}
                      </p>
                      <Button variant="accent" size="sm" onClick={retryAnalysis} className="font-black">
                        <RefreshCw size={14} className="mr-2 animate-spin-hover" /> Retry Analysis
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 bg-slate-50 border-t-2 border-black shrink-0">
                    <Button 
                      variant="success"
                      disabled={true}
                      className="w-full py-4 md:py-6 text-lg md:text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-50 cursor-not-allowed"
                    >
                      <Send size={24} className="mr-3" /> Submit Official Report
                    </Button>
                  </div>
                </motion.div>
              ) : analysis ? (
                <motion.div
                  key="analysis-result"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white brutal-border rounded-2xl brutal-shadow-lg overflow-hidden flex flex-col"
                >
                  <div className="bg-black text-white p-4 md:p-5 flex items-center space-x-3 shrink-0">
                    <Sparkles size={24} className="text-primary" />
                    <h2 className="font-black text-lg md:text-xl uppercase tracking-widest">AI Report</h2>
                  </div>
                  
                  <div className="p-4 md:p-6 space-y-6 flex-1">
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border-2 border-black rounded-xl bg-slate-50 flex flex-col justify-center">
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</p>
                        <p className="font-black text-sm md:text-base leading-tight line-clamp-2">{analysis.category}</p>
                      </div>
                      <div className="p-3 border-2 border-black rounded-xl bg-slate-50 flex flex-col justify-center">
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confidence</p>
                        <p className="font-black text-sm md:text-base leading-tight text-secondary">{analysis.confidence}%</p>
                      </div>
                      <div className="p-3 border-2 border-black rounded-xl bg-slate-50 flex flex-col justify-center">
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</p>
                        <p className="font-black text-sm md:text-base leading-tight line-clamp-2">{analysis.department || 'General'}</p>
                      </div>
                      <div className="p-3 border-2 border-black rounded-xl bg-slate-50 flex flex-col justify-center">
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Est. Resolution</p>
                        <p className="font-black text-sm md:text-base leading-tight text-accent">{analysis.estimatedResolutionTime || 'Unknown'}</p>
                      </div>
                    </div>
                      
                    <div className="p-3 md:p-4 border-2 border-black rounded-xl bg-slate-50 flex flex-col justify-center">
                      <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Priority Score</p>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <p className="font-black text-3xl md:text-4xl text-primary leading-none">{analysis.priorityScore !== undefined ? analysis.priorityScore : (analysis.severityScore !== undefined ? analysis.severityScore : 'N/A')}<span className="text-xl md:text-2xl text-gray-400">/10</span></p>
                          <p className={`font-black text-sm md:text-base leading-tight px-3 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                            analysis.severity === 'High' || analysis.severity === 'Critical' ? 'bg-accent text-white' : 
                            analysis.severity === 'Medium' ? 'bg-warning text-black' : 'bg-success text-black'
                          }`}>{analysis.severity}</p>
                        </div>
                        {(analysis.reasoning || analysis.severityReason) && (
                          <div className="mt-3 bg-white p-3 border-2 border-black/10 rounded-lg">
                            <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm text-gray-800 font-bold">
                              {(analysis.reasoning || analysis.severityReason || '').split(/\. /).filter((p: string) => p.trim()).map((point: string, idx: number) => (
                                <li key={idx}>{point.trim()}{point.endsWith('.') ? '' : '.'}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="font-black text-sm uppercase tracking-wider text-slate-700">Description (Editable)</label>
                      <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 md:p-4 border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-primary bg-slate-50 font-bold text-sm md:text-base resize-none transition-shadow"
                        rows={4}
                      />
                    </div>

                    <div className="p-4 md:p-5 bg-primary/10 border-2 border-black rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                      <h4 className="font-black uppercase text-sm mb-2 text-slate-800">Action Plan</h4>
                      <p className="font-bold text-sm md:text-base mb-4 leading-relaxed">{analysis.recommendedAction}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="primary" className="text-xs">Routing to</Badge>
                        <span className="font-black text-sm">{analysis.department}</span>
                      </div>
                    </div>

                    {auth.currentUser && !auth.currentUser.isAnonymous && (
                      <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border-2 border-transparent hover:border-slate-200 transition-colors">
                        <input 
                          type="checkbox" 
                          id="emailNotif" 
                          checked={useEmail} 
                          onChange={(e) => setUseEmail(e.target.checked)}
                          className="w-5 h-5 border-2 border-black rounded appearance-none checked:bg-black cursor-pointer relative after:content-[''] after:absolute after:top-[2px] after:left-[6px] after:w-1.5 after:h-2.5 after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:opacity-0 checked:after:opacity-100 transition-all" 
                        />
                        <label htmlFor="emailNotif" className="font-bold text-sm cursor-pointer select-none flex-1 flex items-center gap-2">
                          <Mail size={16} className="text-slate-500" />
                          Email me updates on this issue
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="p-4 md:p-6 bg-slate-50 border-t-2 border-black shrink-0">
                    <Button 
                      variant="success"
                      onClick={checkDuplicateAndSubmit}
                      disabled={isSubmitting || !location}
                      className="w-full py-4 md:py-6 text-lg md:text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {isSubmitting ? (
                        <><Loader2 size={24} className="animate-spin mr-3" /> Submitting...</>
                      ) : (
                        <><Send size={24} className="mr-3" /> Submit Official Report</>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-success text-black px-6 py-4 rounded-xl brutal-border brutal-shadow-lg"
          >
            <CheckCircle2 size={24} className="text-black" />
            <span className="font-black text-lg">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDuplicateModal && duplicateReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white brutal-border brutal-shadow-lg rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="bg-warning p-4 border-b-2 border-black flex items-center gap-3">
                <AlertCircle size={24} className="text-black" />
                <h3 className="font-black text-lg md:text-xl uppercase">Possible duplicate report found.</h3>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <p className="font-bold text-gray-700 mb-4 text-sm md:text-base">
                  A very similar issue has already been reported nearby. Would you like to support the existing report instead of creating a new one?
                </p>
                
                <div className="bg-slate-50 border-2 border-black rounded-xl p-4 flex flex-col md:flex-row gap-4 mb-2">
                  <div className="w-full md:w-32 h-32 shrink-0 bg-slate-200 border-2 border-black rounded-lg overflow-hidden relative">
                    <img src={duplicateReport.imageUrl} alt={duplicateReport.category} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-lg">{duplicateReport.summary}</h4>
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                      {duplicateReport.reportId || duplicateReport.id.slice(0,6)} • {duplicateReport.category}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-600 mb-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-primary" />
                        <span className="truncate">{duplicateReport.locality?.formatted || 'Nearby'}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-accent">
                        {formatDistance(calculateDistance(location?.lat || 0, location?.lng || 0, duplicateReport.location.lat, duplicateReport.location.lng))}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-auto pt-2 border-t-2 border-black/5">
                      <Badge variant="outline" className="shadow-none text-[10px]">{duplicateReport.status}</Badge>
                      <Badge variant="primary" className="shadow-none text-[10px]">▲ {duplicateReport.votes || 0} {duplicateReport.votes === 1 ? 'Upvote' : 'Upvotes'}</Badge>
                      <span className="text-[10px] text-gray-400 ml-auto">{new Date(duplicateReport.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 md:p-6 bg-slate-100 border-t-2 border-black flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="primary" 
                  onClick={handleSupportExisting}
                  disabled={isSubmitting}
                  className="flex-1 py-3"
                >
                  {isSubmitting ? 'Supporting...' : 'Support Existing Report'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDuplicateModal(false);
                    executeSubmit();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-3"
                >
                  Create New Anyway
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

