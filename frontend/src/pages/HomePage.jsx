import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listingsAPI, categoriesAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import ListingCard from '../components/ListingCard';
import CategoryCard from '../components/CategoryCard';
import { Search, ArrowRight, Shield, Clock, DollarSign } from 'lucide-react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredListings, setFeaturedListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingsRes, categoriesRes] = await Promise.all([
          listingsAPI.getFeatured(),
          categoriesAPI.getAll(),
        ]);
        setFeaturedListings(listingsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="page-enter" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1725042893312-5ec0dea9e369?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaXZpbmclMjByb29tJTIwYnJpZ2h0fGVufDB8fHx8MTc3MDE2MjQ2NHww&ixlib=rb-4.1.0&q=85"
            alt="Hero background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 via-stone-900/60 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-heading tracking-tight">
              {t('home.hero.title')}<br/>{t('home.hero.titleLine2')}
            </h1>
            <p className="text-lg md:text-xl text-stone-200 mb-8 leading-relaxed">
              {t('home.hero.subtitle')}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input
                  type="text"
                  placeholder={t('home.hero.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 rounded-full border-0 text-lg bg-white shadow-lg"
                  data-testid="hero-search-input"
                />
              </div>
              <Button 
                type="submit"
                className="h-14 px-8 rounded-full bg-[#E05D44] hover:bg-[#C54E36] text-white font-medium btn-press"
                data-testid="hero-search-btn"
              >
                {t('common.search')}
              </Button>
            </form>

            {/* Quick Categories */}
            <div className="flex flex-wrap gap-2 mt-6">
              {['cars', 'heavy-machinery', 'tradies', 'tools', 'party', 'camping'].map((catId) => {
                const cat = categories.find(c => c.id === catId);
                return cat ? (
                  <Link
                    key={cat.id}
                    to={`/search?category=${cat.id}`}
                    className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm hover:bg-white/20 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E05D44]/10 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-[#E05D44]" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1 font-heading">Secure Payments</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  All transactions are protected. Pay securely through our platform.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8DA399]/10 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-[#8DA399]" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1 font-heading">Easy Booking</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Book instantly or request dates. Flexible scheduling for everyone.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1 font-heading">Great Value</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Why buy when you can rent? Save money on items you only need occasionally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-heading tracking-tight">
                Browse by category
              </h2>
              <p className="text-stone-600 mt-2">
                Over 30 categories — from cars to tradies to party gear
              </p>
            </div>
            <Link 
              to="/search"
              className="hidden md:flex items-center gap-1 text-[#E05D44] font-medium hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Featured Categories Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {['cars', 'heavy-machinery', 'tradies', 'tools', 'party', 'camping'].map((catId) => {
              const cat = categories.find(c => c.id === catId);
              return cat ? <CategoryCard key={cat.id} category={cat} /> : null;
            })}
          </div>

          {/* More Categories - Compact */}
          <div className="bg-white rounded-2xl border border-stone-100 p-6">
            <h3 className="font-semibold text-stone-900 mb-4 font-heading">More categories</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {categories.filter(c => !['cars', 'heavy-machinery', 'tradies', 'tools', 'party', 'camping'].includes(c.id)).slice(0, 16).map((cat) => (
                <CategoryCard key={cat.id} category={cat} variant="compact" />
              ))}
            </div>
          </div>

          {/* Mobile view all link */}
          <div className="mt-6 md:hidden text-center">
            <Link 
              to="/search"
              className="inline-flex items-center gap-1 text-[#E05D44] font-medium"
            >
              View all categories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 md:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-heading tracking-tight">
                Popular rentals near you
              </h2>
              <p className="text-stone-600 mt-2">
                Top-rated items from your community
              </p>
            </div>
            <Link 
              to="/search"
              className="hidden md:flex items-center gap-1 text-[#E05D44] font-medium hover:underline"
            >
              Browse all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden">
                  <div className="aspect-[4/3] skeleton" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 skeleton rounded w-3/4" />
                    <div className="h-4 skeleton rounded w-1/2" />
                    <div className="h-6 skeleton rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
              <p className="text-stone-600 mb-4">No listings yet. Be the first to list an item!</p>
              <Link to="/create-listing">
                <Button className="bg-[#E05D44] hover:bg-[#C54E36] rounded-full">
                  List your first item
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile view all link */}
          {featuredListings.length > 0 && (
            <div className="mt-6 md:hidden text-center">
              <Link 
                to="/search"
                className="inline-flex items-center gap-1 text-[#E05D44] font-medium"
              >
                Browse all listings <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <img
              src="https://images.pexels.com/photos/6646884/pexels-photo-6646884.jpeg"
              alt="Community sharing"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 to-stone-900/60" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-xl px-8 md:px-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">
                  Turn your assets into income
                </h2>
                <p className="text-stone-200 text-lg mb-6 leading-relaxed">
                  Got a car sitting in the driveway? Tools in the shed? Skills to share? List anything on RentAll and start earning.
                </p>
                <Link to="/create-listing">
                  <Button 
                    className="bg-[#E05D44] hover:bg-[#C54E36] text-white rounded-full px-8 h-12 font-medium btn-press"
                    data-testid="cta-list-btn"
                  >
                    Start earning today
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
