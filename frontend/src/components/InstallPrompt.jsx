import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share } from 'lucide-react';
import { Button } from '../components/ui/button';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canShowManual, setCanShowManual] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Show manual prompt for mobile users who haven't dismissed
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    
    if (isMobile && !standalone && !dismissed) {
      // Show after 2 seconds for mobile users
      setTimeout(() => setCanShowManual(true), 2000);
    }

    // Listen for beforeinstallprompt event (Android/Desktop Chrome)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt when we have the deferred prompt
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS - show prompt if mobile and not installed
    if (iOS && !standalone && !dismissed) {
      setTimeout(() => setShowPrompt(true), 3000);
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
        setCanShowManual(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setCanShowManual(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleShowPrompt = () => {
    setShowPrompt(true);
  };

  // Don't show anything if already installed
  if (isStandalone) return null;

  // Floating install button for mobile (when prompt is hidden)
  if (!showPrompt && canShowManual) {
    return (
      <button
        onClick={handleShowPrompt}
        className="fixed bottom-24 right-4 md:hidden w-12 h-12 bg-teal-500 text-white rounded-full shadow-lg flex items-center justify-center z-50 animate-bounce"
        data-testid="pwa-install-fab"
        aria-label="Install App"
      >
        <Download size={20} />
      </button>
    );
  }

  // Don't show main prompt if hidden
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-4" data-testid="pwa-install-prompt">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
        aria-label="Dismiss"
        data-testid="pwa-dismiss-btn"
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
                <li className="flex items-center gap-2">
                  Tap the Share button <Share size={14} className="inline text-teal-400" />
                </li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to install</li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <>
              <p className="text-slate-400 text-sm mb-3">
                Get quick access from your home screen with offline support.
              </p>
              <Button 
                onClick={handleInstall}
                className="bg-teal-500 hover:bg-teal-600 text-white w-full"
                size="sm"
                data-testid="pwa-install-btn"
              >
                <Download size={16} className="mr-2" />
                Install App
              </Button>
            </>
          ) : (
            <div className="text-slate-400 text-sm">
              <p className="mb-2">To install on Android:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Tap the menu button (three dots)</li>
                <li>Select "Add to Home Screen" or "Install App"</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
