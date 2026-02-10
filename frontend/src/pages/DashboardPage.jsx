import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, bookingsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { formatPrice, formatDate } from '../lib/utils';
import {
  Plus,
  Package,
  Calendar,
  Users,
  Loader2,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Shield,
  AlertTriangle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [myListings, setMyListings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [listingsRes, bookingsRes, requestsRes] = await Promise.all([
          listingsAPI.getMy(),
          bookingsAPI.getMy(),
          bookingsAPI.getRequests(),
        ]);
        setMyListings(listingsRes.data);
        setMyBookings(bookingsRes.data);
        setBookingRequests(requestsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleBookingAction = async (bookingId, status) => {
    try {
      await bookingsAPI.updateStatus(bookingId, status);
      toast.success(`Booking ${status}`);
      // Refresh requests
      const res = await bookingsAPI.getRequests();
      setBookingRequests(res.data);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleConfirmReceipt = async (bookingId) => {
    try {
      await bookingsAPI.confirmReceipt(bookingId);
      toast.success('Item received confirmed! Payment released to owner.');
      // Refresh bookings
      const res = await bookingsAPI.getMy();
      setMyBookings(res.data);
    } catch (error) {
      console.error('Error confirming receipt:', error);
      toast.error(error.response?.data?.detail || 'Failed to confirm receipt');
    }
  };

  const handleReportIssue = async (bookingId) => {
    const issue = prompt('Please describe the issue:');
    if (!issue) return;
    
    try {
      await bookingsAPI.reportIssue(bookingId, issue);
      toast.success('Issue reported. Our team will review.');
      const res = await bookingsAPI.getMy();
      setMyBookings(res.data);
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast.error('Failed to report issue');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      completed: 'bg-stone-100 text-stone-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-red-100 text-red-700',
      disputed: 'bg-orange-100 text-orange-700',
    };
    return (
      <Badge className={`${variants[status] || 'bg-stone-100 text-stone-700'} capitalize`}>
        {status}
      </Badge>
    );
  };

  const getEscrowBadge = (escrowStatus, receiptConfirmed) => {
    if (receiptConfirmed) {
      return (
        <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Payment Released
        </Badge>
      );
    }
    if (escrowStatus === 'held') {
      return (
        <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Payment Protected
        </Badge>
      );
    }
    return null;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E05D44]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-enter min-h-screen pb-12" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900 font-heading">
              Dashboard
            </h1>
            <p className="text-stone-600 mt-1">
              Welcome back, {user.name}
            </p>
          </div>
          <Link to="/create-listing">
            <Button className="bg-[#E05D44] hover:bg-[#C54E36] rounded-full" data-testid="create-listing-dashboard-btn">
              <Plus className="h-4 w-4 mr-2" />
              List an item
            </Button>
          </Link>
        </div>

        {/* Stats - Clickable */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button 
            onClick={() => {
              const tabsList = document.querySelector('[data-testid="tab-listings"]');
              if (tabsList) tabsList.click();
            }}
            className="bg-white rounded-2xl border border-stone-100 p-6 hover:border-[#E05D44]/50 hover:shadow-md transition-all text-left cursor-pointer"
            data-testid="stat-listings"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E05D44]/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-[#E05D44]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{myListings.length}</p>
                <p className="text-sm text-stone-500">My Listings</p>
              </div>
            </div>
          </button>
          <button 
            onClick={() => {
              const tabsList = document.querySelector('[data-testid="tab-rentals"]');
              if (tabsList) tabsList.click();
            }}
            className="bg-white rounded-2xl border border-stone-100 p-6 hover:border-[#8DA399]/50 hover:shadow-md transition-all text-left cursor-pointer"
            data-testid="stat-rentals"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8DA399]/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#8DA399]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{myBookings.length}</p>
                <p className="text-sm text-stone-500">My Rentals</p>
              </div>
            </div>
          </button>
          <button 
            onClick={() => {
              const tabsList = document.querySelector('[data-testid="tab-requests"]');
              if (tabsList) tabsList.click();
            }}
            className="bg-white rounded-2xl border border-stone-100 p-6 hover:border-amber-500/50 hover:shadow-md transition-all text-left cursor-pointer"
            data-testid="stat-requests"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">
                  {bookingRequests.filter((b) => b.status === 'pending').length}
                </p>
                <p className="text-sm text-stone-500">Pending Requests</p>
              </div>
            </div>
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="bg-stone-100 rounded-full p-1">
            <TabsTrigger value="listings" className="rounded-full" data-testid="tab-listings">
              My Listings
            </TabsTrigger>
            <TabsTrigger value="rentals" className="rounded-full" data-testid="tab-rentals">
              My Rentals
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-full" data-testid="tab-requests">
              Requests
              {bookingRequests.filter((b) => b.status === 'pending').length > 0 && (
                <span className="ml-2 w-5 h-5 bg-[#E05D44] text-white text-xs rounded-full flex items-center justify-center">
                  {bookingRequests.filter((b) => b.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings">
            {myListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/listing/${listing.id}`}
                    className="bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-md transition-shadow"
                    data-testid={`my-listing-${listing.id}`}
                  >
                    <div className="aspect-[16/9] bg-stone-100">
                      <img
                        src={listing.images?.[0] || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-stone-900 mb-1 font-heading">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-stone-500 mb-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {listing.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">
                          {formatPrice(listing.price_per_day)}/day
                        </span>
                        <Badge className={listing.is_available ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-700'}>
                          {listing.is_available ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
                <Package className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <h3 className="font-semibold text-stone-900 mb-2 font-heading">
                  No listings yet
                </h3>
                <p className="text-stone-600 mb-4">
                  Start earning by listing your items
                </p>
                <Link to="/create-listing">
                  <Button className="bg-[#E05D44] hover:bg-[#C54E36] rounded-full">
                    Create your first listing
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Rentals Tab */}
          <TabsContent value="rentals">
            {/* Escrow Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Payment Protection</h4>
                <p className="text-blue-700 text-sm">
                  Your payment is held securely until you confirm you've received the item. 
                  Once confirmed, payment is released to the owner.
                </p>
              </div>
            </div>

            {myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl border border-stone-100 p-4"
                    data-testid={`my-booking-${booking.id}`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        <img
                          src={booking.listing_image || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'}
                          alt={booking.listing_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-stone-900 font-heading truncate">
                            {booking.listing_title}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-stone-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-stone-900 font-medium">
                              <DollarSign className="h-4 w-4" />
                              {formatPrice(booking.total_price)}
                            </span>
                            {booking.status === 'paid' && getEscrowBadge(booking.escrow_status, booking.receipt_confirmed)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Confirm Receipt Section */}
                    {booking.status === 'paid' && !booking.receipt_confirmed && (
                      <div className="mt-4 pt-4 border-t border-stone-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="text-sm text-stone-600">
                            Did you receive this item? Confirm to release payment to owner.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleReportIssue(booking.id)}
                              variant="outline"
                              size="sm"
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              data-testid={`report-issue-${booking.id}`}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Report Issue
                            </Button>
                            <Button
                              onClick={() => handleConfirmReceipt(booking.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`confirm-receipt-${booking.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm Receipt
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Completed message */}
                    {booking.receipt_confirmed && (
                      <div className="mt-4 pt-4 border-t border-stone-100">
                        <p className="text-sm text-green-600 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Receipt confirmed - payment released to owner
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
                <Calendar className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <h3 className="font-semibold text-stone-900 mb-2 font-heading">
                  No rentals yet
                </h3>
                <p className="text-stone-600 mb-4">
                  Find something great to rent
                </p>
                <Link to="/search">
                  <Button className="bg-[#E05D44] hover:bg-[#C54E36] rounded-full">
                    Browse listings
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            {bookingRequests.length > 0 ? (
              <div className="space-y-4">
                {bookingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-2xl border border-stone-100 p-4"
                    data-testid={`booking-request-${request.id}`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        <img
                          src={request.listing_image || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'}
                          alt={request.listing_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-stone-900 font-heading truncate">
                            {request.listing_title}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-stone-600 mb-2">
                          <span className="font-medium">{request.renter_name}</span> wants to rent
                        </p>
                        <div className="flex items-center gap-4 text-sm text-stone-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(request.start_date)} - {formatDate(request.end_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {formatPrice(request.total_price)}
                          </span>
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleBookingAction(request.id, 'confirmed')}
                              className="bg-[#8DA399] hover:bg-[#768C82] rounded-full"
                              data-testid={`confirm-booking-${request.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBookingAction(request.id, 'rejected')}
                              className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`reject-booking-${request.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
                <Users className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <h3 className="font-semibold text-stone-900 mb-2 font-heading">
                  No booking requests
                </h3>
                <p className="text-stone-600">
                  Requests for your listings will appear here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
