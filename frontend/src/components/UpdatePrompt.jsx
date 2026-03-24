import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

export function UpdatePrompt() {
  const [registration, setRegistration] = useState(null);
  const [show, setShow] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const onUpdate = (event) => {
      setRegistration(event.detail?.registration || null);
      setShow(true);
    };

    window.addEventListener('rentall:update-available', onUpdate);
    return () => window.removeEventListener('rentall:update-available', onUpdate);
  }, []);

  const applyUpdate = () => {
    if (!registration?.waiting) return;
    setUpdating(true);
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => window.location.reload(),
      { once: true }
    );
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-[#1C1917] text-[#FAFAF9] border border-stone-700 rounded-2xl p-4 shadow-2xl z-50"
      data-testid="update-prompt"
    >
      <p className="font-medium mb-1">New version available</p>
      <p className="text-sm text-stone-300 mb-3">
        Update now to get the latest fixes and features.
      </p>
      <div className="flex gap-2">
        <Button
          onClick={applyUpdate}
          disabled={updating}
          className="flex-1 bg-[#E05D44] hover:bg-[#C54E36]"
          data-testid="update-now-btn"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {updating ? 'Updating...' : 'Update now'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShow(false)}
          className="border-stone-600 text-stone-200 hover:bg-stone-800"
        >
          Later
        </Button>
      </div>
    </div>
  );
}

