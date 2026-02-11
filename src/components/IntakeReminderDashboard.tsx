import { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

export const IntakeReminderDashboard = () => {
  const [message, setMessage] = useState('You can return within 7 days — progress saves automatically.');
  const [urgencyClass, setUrgencyClass] = useState('text-primary');

  useEffect(() => {
    const iso = localStorage.getItem('rcms_expiry_iso');
    if (!iso) return;

    const updateMessage = () => {
      const ms = new Date(iso).getTime() - Date.now();
      
      if (ms <= 0) {
        setMessage('⚠️ Intake window expired — please start a new one.');
        setUrgencyClass('text-destructive font-bold');
        return;
      }

      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);

      if (d < 1) {
        setMessage(`⚠️ Intake expires soon — ${h} hours remaining.`);
        setUrgencyClass('text-destructive font-bold');
      } else if (d < 3) {
        setMessage(`You have ${d} days ${h} hours remaining to complete your intake.`);
        setUrgencyClass('text-yellow-600 font-semibold');
      } else {
        setMessage(`You can return within ${d} days — progress saves automatically.`);
        setUrgencyClass('text-primary font-bold');
      }
    };

    updateMessage();
    const interval = setInterval(updateMessage, 3600000); // Update every hour
    return () => clearInterval(interval);
  }, []);

  const iso = localStorage.getItem('rcms_expiry_iso');
  if (!iso) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-accent px-3 py-2 rounded-lg mb-3">
      <Clock className="w-4 h-4 text-primary" />
      <span className={`text-sm ${urgencyClass}`}>
        {message}
      </span>
    </div>
  );
};
