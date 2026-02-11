import { useEffect, useState } from 'react';

export function IntakeReminderBanner() {
  const [reminderText, setReminderText] = useState("You can return within 7 days — progress saves automatically.");
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const updateReminder = () => {
      const expiry = localStorage.getItem('rcms_expiry_iso');
      if (!expiry) {
        setReminderText("You can return within 7 days — progress saves automatically.");
        setUrgencyLevel('normal');
        return;
      }

      const ms = new Date(expiry).getTime() - new Date().getTime();
      
      if (ms <= 0) {
        setReminderText("⚠️ Intake window expired — please start a new one.");
        setUrgencyLevel('critical');
        return;
      }

      const days = Math.floor(ms / 86400000);
      const hours = Math.floor((ms % 86400000) / 3600000);

      if (days < 1) {
        setReminderText(`⚠️ Intake expires soon — ${hours} hours remaining.`);
        setUrgencyLevel('critical');
      } else if (days < 3) {
        setReminderText(`You have ${days} days ${hours} hours remaining to complete your intake.`);
        setUrgencyLevel('warning');
      } else {
        setReminderText(`You can return within ${days} days — progress saves automatically.`);
        setUrgencyLevel('normal');
      }
    };

    updateReminder();
    const interval = setInterval(updateReminder, 3600000); // Update every hour

    return () => clearInterval(interval);
  }, []);

  const getColorClass = () => {
    switch (urgencyLevel) {
      case 'critical':
        return 'text-[#b00020]';
      case 'warning':
        return 'text-[#b09837]';
      default:
        return 'text-[#0f2a6a]';
    }
  };

  return (
    <div 
      className="rcms-dash-reminder"
      role="status"
      aria-live="polite"
    >
      <span className="rcms-dash-icon">⏳</span>
      <span className={getColorClass()}>
        {reminderText}
      </span>

      <style>{`
        .rcms-dash-reminder {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fdf8e1;
          border-left: 4px solid #b09837;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          margin: 0 0 12px;
        }
        .rcms-dash-icon {
          font-size: 1rem;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}
