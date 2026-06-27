import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white brutal-border brutal-shadow-lg rounded-xl p-6 max-w-sm w-full"
          >
            <h3 className="text-xl font-black uppercase mb-2">{title}</h3>
            <p className="text-gray-700 font-medium mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button variant="accent" onClick={onConfirm}>Delete</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
