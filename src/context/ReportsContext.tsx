import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Report } from '../types';
import { ReportService } from '../services/ReportService';
import { onAuthStateChanged } from 'firebase/auth';

interface ReportsContextType {
  reports: Report[];
  loading: boolean;
  refreshReports: () => void;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider = ({ children }: { children: ReactNode }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    const data = await ReportService.getReports();
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // If we previously had a snapshot listener, clean it up
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = undefined;
      }

      if (!user) {
        // Guest mode, just load local reports once
        loadReports();
        return;
      }
      
      // Authenticated mode, use onSnapshot
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
        const fbReports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
        const localReports = ReportService.getLocalReports();
        
        const allReports = [...localReports, ...fbReports];
        const uniqueReports = Array.from(new Map(allReports.map(item => [item.id, item])).values());
        
        uniqueReports.sort((a, b) => b.createdAt - a.createdAt);
        
        setReports(uniqueReports);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching reports from Firestore in Context:", error);
        loadReports();
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const refreshReports = () => {
    loadReports();
  };

  return (
    <ReportsContext.Provider value={{ reports, loading, refreshReports }}>
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};

