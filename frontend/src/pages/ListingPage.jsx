import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, bookingsAPI, reviewsAPI, messagesAPI, paymentsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import ReviewCard from '../components/ReviewCard';
import StaticMap from '../components/StaticMap';
import { formatPrice, formatDate, getInitials } from '../lib/utils';
import {
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Calendar as CalendarIcon,
  Shield,
  Loader2,
  Send,
} from 'lucide-react';

export default function ListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [currentImage, setCurrentImage] = useState(0);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingRes, reviewsRes, datesRes] = await Promise.all([
          listingsAPI.getById(id),
          reviewsAPI.getByListing(id),
          bookingsAPI.getBookedDates(id),
        ]);
        setListing(listingRes.data);
        setReviews(reviewsRes.data);

        // Parse booked date ranges
        const booked = datesRes.data.flatMap((range) => {
          const start = parseISO(range.start);
          const end = parseISO(range.end);
          const dates = [];
          let current = start;
          while (current <= end) {
            dates.push(new Date(current));
            current = addDays(current, 1);
          }
          return dates;
        });
        setBookedDates(booked);
      } catch (error) {
        console.error('Error fetching listing:', error);
        toast.error('Listing not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please log in to book');
      navigate('/login');
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      toast.error('Please select dates');
      return;
    }

    setBooking(true);
    try {
      const bookingRes = await bookingsAPI.create({
        listing_id: id,
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });

      // Create checkout session
      const checkoutRes = await paymentsAPI.createCheckout({
        booking_id: bookingRes.data.id,
        origin_url: window.location.origin,
      });

      // Redirect to Stripe
      window.location.href = checkoutRes.data.url;
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setBooking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      toast.error('Please log in to send messages');
      navigate('/login');
      return;
    }

    if (!message.trim()) return;

    setSendingMessage(true);
    try {
      await messagesAPI.send({
        recipient_id: listing.owner_id,
        content: message,
        listing_id: id,
      });
      toast.success('Message sent!');
      setMessage('');
      setMessageOpen(false);
    } catch (error) {
      console.error('Message error:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E05D44]" />
      </div>
    );
  }

  if (!listing) return null;

  const days =
    dateRange.from && dateRange.to
      ? differenceInDays(dateRange.to, dateRange.from)
      : 0;
  const totalPrice = days > 0 ? listing.price_per_day * days : 0;
  const platformFee = totalPrice * 0.05;
  const isOwner = user?.id === listing.owner_id;

  const images = listing.images?.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'];

  return (
    <div className="page-enter min-h-screen pb-20" data-testid="listing-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-stone-600 hover:text-stone-900 mb-6"
          data-testid="back-btn"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-7 space-y-8">
            {/* Image Gallery */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100">
                <img
                  src={images[currentImage]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImage((i) => (i === 0 ? images.length - 1 : i - 1))
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                    data-testid="prev-image-btn"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImage((i) => (i === images.length - 1 ? 0 : i + 1))
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                    data-testid="next-image-btn"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentImage ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Title & Location */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-stone-900 font-heading">
                  {listing.title}
                </h1>
                {listing.review_count > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-5 w-5 fill-[#E05D44] text-[#E05D44]" />
                    <span className="font-semibold">{listing.avg_rating.toFixed(1)}</span>
                    <span className="text-stone-500">({listing.review_count})</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-stone-500">
                <MapPin className="h-4 w-4" />
                <span>{listing.location}</span>
              </div>
            </div>

            {/* Owner */}
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={listing.owner_avatar} />
                  <AvatarFallback className="bg-stone-200 text-stone-600">
                    {getInitials(listing.owner_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-stone-900">{listing.owner_name}</p>
                  <p className="text-sm text-stone-500">Owner</p>
                </div>
              </div>

              {!isOwner && (
                <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      data-testid="message-owner-btn"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-heading">
                        Message {listing.owner_name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Textarea
                        placeholder="Ask about availability, condition, or pickup details..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        data-testid="message-textarea"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendingMessage}
                        className="w-full bg-[#E05D44] hover:bg-[#C54E36] rounded-full"
                        data-testid="send-message-btn"
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send message
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-3 font-heading">
                About this item
              </h2>
              <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Location Map */}
            {listing.latitude && listing.longitude && (
              <div>
                <h2 className="text-lg font-semibold text-stone-900 mb-3 font-heading">
                  Location
                </h2>
                <div className="h-[250px] rounded-2xl overflow-hidden border border-stone-200">
                  <StaticMap
                    latitude={listing.latitude}
                    longitude={listing.longitude}
                    title={listing.title}
                  />
                </div>
                <p className="text-sm text-stone-500 mt-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {listing.location}
                </p>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-4 font-heading">
                Reviews ({reviews.length})
              </h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-stone-500 py-8 text-center bg-white rounded-2xl border border-stone-100">
                  No reviews yet
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-2xl font-bold text-stone-900">
                    {formatPrice(listing.price_per_day)}
                  </span>
                  <span className="text-stone-500">/ day</span>
                </div>

                {/* Calendar */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Select dates
                  </label>
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    disabled={(date) =>
                      date < new Date() ||
                      bookedDates.some(
                        (d) => d.toDateString() === date.toDateString()
                      )
                    }
                    className="rounded-xl border border-stone-200"
                    data-testid="booking-calendar"
                  />
                </div>

                {/* Price Breakdown */}
                {days > 0 && (
                  <div className="space-y-2 mb-6 pb-6 border-b border-stone-100">
                    <div className="flex justify-between text-stone-600">
                      <span>
                        {formatPrice(listing.price_per_day)} × {days} days
                      </span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Service fee (5%)</span>
                      <span>{formatPrice(platformFee)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-stone-900 pt-2">
                      <span>Total</span>
                      <span>{formatPrice(totalPrice + platformFee)}</span>
                    </div>
                  </div>
                )}

                {/* Book Button */}
                {isOwner ? (
                  <Link to="/dashboard">
                    <Button
                      className="w-full h-12 rounded-full bg-stone-900 hover:bg-stone-800"
                      data-testid="manage-listing-btn"
                    >
                      Manage listing
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={handleBooking}
                    disabled={days === 0 || booking}
                    className="w-full h-12 rounded-full bg-[#E05D44] hover:bg-[#C54E36] btn-press"
                    data-testid="book-now-btn"
                  >
                    {booking ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {days === 0 ? 'Select dates to book' : 'Book now'}
                  </Button>
                )}

                {/* Trust Badge */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-100 text-sm text-stone-500">
                  <Shield className="h-4 w-4 text-[#8DA399]" />
                  <span>Secure payment through Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
