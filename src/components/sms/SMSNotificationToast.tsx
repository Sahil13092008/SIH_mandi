import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare, X, ArrowRight, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SMSNotificationToast: React.FC = () => {
  const { newSmsAlert, setNewSmsAlert, setRole, language } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (newSmsAlert) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [newSmsAlert]);

  if (!newSmsAlert || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-stone-900 text-white rounded-xl shadow-2xl border border-amber-500/30 overflow-hidden"
      >
        <div className="bg-amber-600 px-3.5 py-1.5 flex items-center justify-between text-xs font-semibold text-white">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Simulated SMS Sent • {newSmsAlert.phone}</span>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-amber-100 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-3.5 space-y-2">
          <div className="text-xs text-stone-300 font-mono leading-relaxed bg-stone-800/80 p-2.5 rounded border border-stone-700">
            {language === 'hi' && newSmsAlert.message_hi ? newSmsAlert.message_hi : newSmsAlert.message}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-stone-400">
              {new Date(newSmsAlert.sent_at).toLocaleTimeString()} • Auto Dispatched
            </span>
            <button
              onClick={() => {
                setRole('sms');
                setVisible(false);
              }}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>View SMS Inbox</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
