import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '../components/ui/button';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show iOS prompt if not installed and not dismissed
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or prompt is hidden
  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-4">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={20} />
      </button>
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-6 h-6 text-teal-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-lg mb-1">Install RentAll</h3>
          
          {isIOS ? (
            <div className="text-slate-400 text-sm">
              <p className="mb-2">Install this app on your iPhone:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Tap the Share button <span className="inline-block w-4 h-4 align-middle">⬆️</span></li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to install</li>
              </ol>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-3">
                Get quick access from your home screen with offline support.
              </p>
              <Button 
                onClick={handleInstall}
                className="bg-teal-500 hover:bg-teal-600 text-white w-full"
                size="sm"
              >
                <Download size={16} className="mr-2" />
                Install App
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
