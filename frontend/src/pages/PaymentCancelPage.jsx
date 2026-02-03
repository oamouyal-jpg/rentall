import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4" data-testid="payment-cancel-page">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-stone-400" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-4 font-heading">
          Payment cancelled
        </h1>
        <p className="text-stone-600 mb-8">
          Your payment was cancelled. No charges were made to your account.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/search">
            <Button className="bg-[#E05D44] hover:bg-[#C54E36] rounded-full px-8">
              Continue browsing
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="rounded-full px-8">
              Return home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
