import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseISO, isToday } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, messagesAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, CalendarDays, MessageSquare, ClipboardList, ArrowRight } from 'lucide-react';

export default function TodayPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayRentals, setTodayRentals] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      try {
        const [myBookingsRes, requestsRes, convRes] = await Promise.all([
          bookingsAPI.getMy(),
          bookingsAPI.getRequests(),
          messagesAPI.getConversations(),
        ]);
        const rentalsToday = myBookingsRes.data.filter((b) => {
          try {
            return isToday(parseISO(b.start_date)) || isToday(parseISO(b.end_date));
          } catch {
            return false;
          }
        });
        setTodayRentals(rentalsToday);
        setPendingRequests(requestsRes.data.filter((r) => r.status === 'pending'));
        setUnreadCount(convRes.data.reduce((acc, c) => acc + (c.unread_count || 0), 0));
      } catch (err) {
        console.error('Failed loading Today data:', err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E05D44]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-enter min-h-screen pb-24" data-testid="today-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900 font-heading mb-2">Today</h1>
        <p className="text-stone-600 mb-6">Your important updates and actions for today.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link to="/dashboard?tab=rentals" className="bg-white rounded-2xl border border-stone-200 p-4 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Today&apos;s rentals</p>
                <p className="text-2xl font-bold text-stone-900">{todayRentals.length}</p>
              </div>
              <CalendarDays className="h-6 w-6 text-[#8DA399]" />
            </div>
          </Link>
          <Link to="/dashboard?tab=requests" className="bg-white rounded-2xl border border-stone-200 p-4 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Pending requests</p>
                <p className="text-2xl font-bold text-stone-900">{pendingRequests.length}</p>
              </div>
              <ClipboardList className="h-6 w-6 text-amber-500" />
            </div>
          </Link>
          <Link to="/messages" className="bg-white rounded-2xl border border-stone-200 p-4 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Unread messages</p>
                <p className="text-2xl font-bold text-stone-900">{unreadCount}</p>
              </div>
              <MessageSquare className="h-6 w-6 text-[#E05D44]" />
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-stone-900">Action items</h2>
            <Link to="/dashboard?tab=requests" className="text-sm text-[#E05D44] inline-flex items-center gap-1">
              Open dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {!user.phone_verified && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-sm text-amber-900">Verify your phone to unlock post-payment contact sharing.</span>
                <Link to="/settings"><Button size="sm" variant="outline">Verify</Button></Link>
              </div>
            )}
            {!user.stripe_connected && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-sm text-blue-900">Connect Stripe to receive payouts automatically.</span>
                <Link to="/settings"><Button size="sm" variant="outline">Connect</Button></Link>
              </div>
            )}
            {pendingRequests.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-sm text-stone-800">
                  You have <Badge className="ml-1">{pendingRequests.length}</Badge> booking request(s) waiting.
                </span>
                <Link to="/dashboard?tab=requests"><Button size="sm">Review</Button></Link>
              </div>
            )}
            {todayRentals.length === 0 && pendingRequests.length === 0 && user.phone_verified && user.stripe_connected && (
              <p className="text-sm text-stone-600">No urgent actions for today. You&apos;re all set.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

