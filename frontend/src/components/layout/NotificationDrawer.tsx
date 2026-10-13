import React from 'react';
import { Drawer } from '../ui/Overlays';
import { useUiStore } from '../../store/uiStore';
import { StatusBadge } from '../ui/StatusBadge';
import { CheckCheck, Trash2, Clock, AlertCircle } from 'lucide-react';
import { formatDateTimeIST } from '../../lib/formatters';

export const NotificationDrawer: React.FC = () => {
  const {
    notificationDrawerOpen,
    setNotificationDrawerOpen,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
  } = useUiStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Drawer
      isOpen={notificationDrawerOpen}
      onClose={() => setNotificationDrawerOpen(false)}
      title="Grid Alerts & Advisory Telemetry"
      description={`${notifications.length} active alerts (${unreadCount} unread)`}
      width="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-secondary hover:text-primary hover:bg-surface disabled:opacity-40 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-accent-green" />
            <span>Mark All as Read</span>
          </button>
          <button
            type="button"
            onClick={() => setNotificationDrawerOpen(false)}
            className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-surface text-xs font-medium text-primary border border-border transition-colors"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-muted text-xs">
            <CheckCheck className="w-8 h-8 mx-auto mb-2 text-accent-green opacity-80" />
            <p>All clear! Zero active alerts or stability warnings.</p>
          </div>
        ) : (
          notifications.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all duration-150 space-y-2.5 ${
                alert.read
                  ? 'bg-base/60 border-border/60 opacity-80'
                  : 'bg-elevated border-border shadow-md'
              }`}
            >
              {/* Header: severity, type, time */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={alert.severity} size="sm" />
                  <span className="text-[11px] font-mono text-muted uppercase tracking-wider">
                    {alert.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{formatDateTimeIST(alert.timestamp)}</span>
                </div>
              </div>

              {/* Title & Cause */}
              <div>
                <h4 className="text-xs font-semibold text-primary">{alert.title}</h4>
                <p className="text-[11px] text-secondary mt-0.5 leading-relaxed">
                  <strong className="text-muted">Cause:</strong> {alert.cause}
                </p>
              </div>

              {/* Recommended Action */}
              <div className="p-2.5 rounded-lg bg-base border border-border/80 text-[11px] space-y-1">
                <div className="font-semibold text-accent-cyan flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Recommended Dispatch Action:</span>
                </div>
                <p className="text-secondary">{alert.recommendedAction}</p>
                <p className="text-[10px] text-muted italic">"{alert.whyExplanation}"</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                {!alert.read ? (
                  <button
                    type="button"
                    onClick={() => markNotificationAsRead(alert.id)}
                    className="text-accent-cyan hover:underline font-medium"
                  >
                    Mark as Read
                  </button>
                ) : (
                  <span className="text-muted text-[10px]">Read</span>
                )}
                <button
                  type="button"
                  onClick={() => clearNotification(alert.id)}
                  aria-label="Delete alert"
                  className="text-muted hover:text-accent-red transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
};
