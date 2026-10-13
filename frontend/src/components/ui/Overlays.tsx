import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 1. Modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={twMerge(
          'relative w-full rounded-xl bg-surface border border-border shadow-2xl overflow-hidden',
          maxWidth
        )}
      >
        <div className="flex items-start justify-between p-4 border-b border-border bg-elevated/40">
          <div>
            <h3 className="text-sm font-semibold text-primary">{title}</h3>
            {description && <p className="text-xs text-secondary mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-muted hover:text-primary transition-colors p-1 rounded-md hover:bg-elevated"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 max-h-[75vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 p-3 border-t border-border bg-base/50">{footer}</div>}
      </div>
    </div>
  );
};

// 2. Drawer
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  position?: 'right' | 'left';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-md',
  position = 'right',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={clsx(
          'fixed inset-y-0 flex max-w-full',
          position === 'right' ? 'right-0' : 'left-0'
        )}
      >
        <div
          className={twMerge(
            'w-screen bg-surface border-border shadow-2xl flex flex-col',
            position === 'right' ? 'border-l' : 'border-r',
            width
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-border bg-elevated/40">
            <div>
              <h3 className="text-sm font-semibold text-primary">{title}</h3>
              {description && <p className="text-xs text-secondary mt-0.5">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-elevated"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
          {footer && <div className="p-3 border-t border-border bg-base/50">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

// 3. Tabs
interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={twMerge('flex items-center border-b border-border gap-1 overflow-x-auto', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'px-3.5 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all duration-150 flex items-center gap-1.5 focus:outline-none',
              isActive
                ? 'border-accent-cyan text-accent-cyan font-semibold bg-accent-cyan/5'
                : 'border-transparent text-secondary hover:text-primary hover:border-border'
            )}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-elevated text-secondary font-mono border border-border">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
