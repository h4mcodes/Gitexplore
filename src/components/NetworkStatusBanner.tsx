import { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  });
  const [showRestoredNotice, setShowRestoredNotice] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissed(false);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false);
      setShowRestoredNotice(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestoredNotice) {
    return null;
  }

  if (isDismissed && !showRestoredNotice) {
    return null;
  }

  return (
    <div
      className={`network-status-banner ${!isOnline ? 'is-offline' : 'is-restored'}`}
      role="status"
      aria-live="polite"
    >
      <div className="network-banner-content">
        {!isOnline ? (
          <>
            <div className="network-banner-icon-wrap offline">
              <WifiOff size={13} />
            </div>
            <div className="network-banner-text">
              <strong>Offline Mode</strong>
              <span>Serving cached repository intelligence. Live API updates are paused.</span>
            </div>
          </>
        ) : (
          <>
            <div className="network-banner-icon-wrap online">
              <Wifi size={13} />
            </div>
            <div className="network-banner-text">
              <strong>Connected</strong>
              <span>Network restored. Real-time GitHub API sync is active.</span>
            </div>
          </>
        )}
      </div>

      <div className="network-banner-actions">
        {!isOnline && (
          <button
            type="button"
            className="network-banner-btn"
            onClick={() => window.location.reload()}
            title="Reload application"
          >
            <RefreshCw size={11} />
            <span>Reload</span>
          </button>
        )}
        <button
          type="button"
          className="network-banner-dismiss"
          onClick={() => {
            setIsDismissed(true);
            setShowRestoredNotice(false);
          }}
          aria-label="Dismiss banner"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
