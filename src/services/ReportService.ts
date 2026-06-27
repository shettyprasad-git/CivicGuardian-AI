import { Report, UserProfile, Comment, Vote } from '../types';
import { 
  collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export class ReportService {
  static isGuestMode(): boolean {
    return !auth.currentUser;
  }

  static getLocalReports(): Report[] {
    try {
      const local = localStorage.getItem('civic_guardian_local_reports');
      if (local) {
        return JSON.parse(local);
      }
    } catch (e) {
      console.error("Error reading local reports", e);
    }
    return [];
  }

  static async getReports(): Promise<Report[]> {
    if (this.isGuestMode()) {
      return this.getLocalReports().sort((a, b) => b.createdAt - a.createdAt);
    }
    
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fbReports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      
      const localReports = this.getLocalReports();
      const allReports = [...localReports, ...fbReports];
      const uniqueReports = Array.from(new Map(allReports.map(item => [item.id, item])).values());
      uniqueReports.sort((a, b) => b.createdAt - a.createdAt);
      return uniqueReports;
    } catch (error) {
      console.error("Error fetching reports from Firestore:", error);
      return this.getLocalReports().sort((a, b) => b.createdAt - a.createdAt);
    }
  }

  static generateReportId(): string {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `CG-${year}-${randomNum}`;
  }

  static async createReport(report: Omit<Report, 'id'>): Promise<string> {
    const reportWithId = {
      ...report,
      reportId: this.generateReportId(),
      upvotedBy: report.upvotedBy || [],
    };

    if (this.isGuestMode()) {
      const localReports = this.getLocalReports();
      const id = `local_${crypto.randomUUID()}`;
      localReports.push({ ...reportWithId, id });
      localStorage.setItem('civic_guardian_local_reports', JSON.stringify(localReports));
      return id;
    }

    try {
      const docRef = await addDoc(collection(db, 'reports'), reportWithId);
      return docRef.id;
    } catch (error) {
      console.error("Error creating report in Firestore:", error);
      // Fallback to local
      const localReports = this.getLocalReports();
      const id = `local_${crypto.randomUUID()}`;
      localReports.push({ ...reportWithId, id });
      localStorage.setItem('civic_guardian_local_reports', JSON.stringify(localReports));
      return id;
    }
  }

  static async updateReport(id: string, updates: Partial<Report>): Promise<void> {
    if (this.isGuestMode() || id.startsWith('local_')) {
      const localReports = this.getLocalReports();
      const index = localReports.findIndex(r => r.id === id);
      if (index !== -1) {
        localReports[index] = { ...localReports[index], ...updates };
        localStorage.setItem('civic_guardian_local_reports', JSON.stringify(localReports));
      }
      return;
    }

    try {
      const docRef = doc(db, 'reports', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating report:", error);
    }
  }

  static async deleteReport(id: string): Promise<void> {
    if (this.isGuestMode() || id.startsWith('local_')) {
      const localReports = this.getLocalReports();
      const updatedReports = localReports.filter(r => r.id !== id);
      localStorage.setItem('civic_guardian_local_reports', JSON.stringify(updatedReports));
      return;
    }

    try {
      const docRef = doc(db, 'reports', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting report:", error);
      throw error;
    }
  }

  static async toggleUpvote(report: Report, userId: string): Promise<void> {
    const upvotedBy = report.upvotedBy || [];
    const hasUpvoted = upvotedBy.includes(userId);
    
    let newUpvotedBy;
    let newVotes;

    if (hasUpvoted) {
      newUpvotedBy = upvotedBy.filter(id => id !== userId);
      newVotes = Math.max(0, report.votes - 1);
    } else {
      newUpvotedBy = [...upvotedBy, userId];
      newVotes = report.votes + 1;
    }

    await this.updateReport(report.id, {
      upvotedBy: newUpvotedBy,
      votes: newVotes
    });
  }

  static async clearGuestReports(guestId: string): Promise<void> {
    try {
      localStorage.removeItem('civic_guardian_local_reports');
      // Also try to clear firestore if any exist with this guest ID
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, where('userId', '==', guestId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing guest reports:", error);
      throw error;
    }
  }
}
