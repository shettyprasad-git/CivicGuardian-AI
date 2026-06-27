import { motion } from 'motion/react';
import { IssueStatus } from '../types';
import { Check, Clock, AlertCircle, PlayCircle, CheckCircle, XCircle } from 'lucide-react';

const statuses: IssueStatus[] = [
  'Reported',
  'AI Verified',
  'Community Verified',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed'
];

const getStatusColor = (status: IssueStatus) => {
  switch (status) {
    case 'Reported': return 'bg-gray-300 text-gray-700';
    case 'AI Verified': return 'bg-primary text-black';
    case 'Community Verified': return 'bg-[#4ECDC4] text-black';
    case 'Assigned': return 'bg-[#FFE66D] text-black';
    case 'In Progress': return 'bg-warning text-black';
    case 'Resolved': return 'bg-success text-white';
    case 'Closed': return 'bg-gray-800 text-white';
    default: return 'bg-gray-200 text-gray-600';
  }
};

const getStatusIcon = (status: IssueStatus) => {
  switch (status) {
    case 'Reported': return <AlertCircle size={12} />;
    case 'AI Verified': return <Check size={12} />;
    case 'Community Verified': return <Check size={12} />;
    case 'Assigned': return <Clock size={12} />;
    case 'In Progress': return <PlayCircle size={12} />;
    case 'Resolved': return <CheckCircle size={12} />;
    case 'Closed': return <XCircle size={12} />;
    default: return <Clock size={12} />;
  }
};

export const StatusTimeline = ({ currentStatus, onStatusChange }: { currentStatus: IssueStatus, onStatusChange?: (status: IssueStatus) => void }) => {
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="flex flex-col gap-2 mt-4 mb-2">
      <div className="flex items-center justify-between w-full relative">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500 ease-in-out" 
          style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
        ></div>
        
        {statuses.map((status, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <motion.div 
              key={status}
              initial={false}
              animate={{ 
                scale: isCurrent ? 1.2 : 1,
                opacity: isCompleted ? 1 : 0.5
              }}
              className={`relative z-10 flex flex-col items-center ${onStatusChange ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
              onClick={() => onStatusChange && onStatusChange(status)}
              title={status}
            >
              <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'border-black' : 'border-gray-300'} ${isCompleted ? getStatusColor(status) : 'bg-white text-gray-300'} transition-colors duration-300 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
                {getStatusIcon(status)}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-between w-full px-1">
        <span className="text-[9px] font-bold text-gray-500 uppercase">Reported</span>
        <span className="text-[9px] font-bold text-primary uppercase text-center flex-1">{currentStatus}</span>
        <span className="text-[9px] font-bold text-gray-500 uppercase">Closed</span>
      </div>
    </div>
  );
};
