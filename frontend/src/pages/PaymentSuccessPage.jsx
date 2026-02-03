import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState('loading');
  const [attempts, setAttempts] = useState(0);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId || !user) return;

    const pollStatus = async () => {
      try {
        const res = await paymentsAPI.getStatus(sessionId);
        if (res.data.payment_status === 'paid') {
          setStatus('success');
        } else if (res.data.status === 'expired') {
          setStatus('expired');
        } else if (attempts < 5) {
          setAttempts((a) => a + 1);
          setTimeout(pollStatus, 2000);
        } else {
          setStatus('pending');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        if (attempts < 5) {
          setAttempts((a) => a + 1);
          setTimeout(pollStatus, 2000);
        } else {
          setStatus('error');
        }
      }
    };

    pollStatus();
  }, [sessionId, user, attempts]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4" data-testid="payment-success-page">
      <div className="text-center max-w-md">
        {status === 'loading' ? (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-[#E05D44] mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-stone-900 mb-4 font-heading">
              Processing payment...
            </h1>
            <p className="text-stone-600">
              Please wait while we confirm your payment
            </p>
          </>
        ) : status === 'success' ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-4 font-heading">
              Payment successful!
            </h1>
            <p className="text-stone-600 mb-8">
              Your rental has been booked. You can view your bookings in your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/dashboard">
                <Button className="bg-[#E05D44] hover:bg-[#C54E36] rounded-full px-8">
                  View bookings
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="rounded-full px-8">
                  Continue browsing
                </Button>
              </Link>
            </div>
          </>
        ) : status === 'pending' ? (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-4 font-heading">
              Payment pending
            </h1>
            <p className="text-stone-600 mb-8">
              Your payment is still being processed. Check your email for confirmation.
            </p>
            <Link to="/dashboard">
              <Button className="bg-[#E05D44] hover:bg-[#C54E36] rounded-full px-8">
                Go to dashboard
              </Button>
            </Link>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">!</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-4 font-heading">
              Something went wrong
            </h1>
            <p className="text-stone-600 mb-8">
              We couldn't verify your payment. Please contact support if you were charged.
            </p>
            <Link to="/">
              <Button variant="outline" className="rounded-full px-8">
                Return home
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
