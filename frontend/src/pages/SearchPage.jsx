import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listingsAPI, categoriesAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import ListingCard from '../components/ListingCard';
import CategoryCard from '../components/CategoryCard';
import ListingsMap from '../components/ListingsMap';
import { Search, SlidersHorizontal, X, Loader2, Map, List, MapPin } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedListing, setSelectedListing] = useState(null);

  // Filter state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [location, setLocation] = useState('');

  useEffect(() => {
    categoriesAPI.getAll().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params = {};
        if (query) params.query = query;
        if (category) params.category = category;
        if (priceRange[0] > 0) params.min_price = priceRange[0];
        if (priceRange[1] < 500) params.max_price = priceRange[1];

        const res = await listingsAPI.getAll(params);
        setListings(res.data);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchListings, 300);
    return () => clearTimeout(debounce);
  }, [query, category, priceRange]);

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (query) newParams.set('q', query);
    if (category) newParams.set('category', category);
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setPriceRange([0, 500]);
    setLocation('');
    setSearchParams({});
  };

  const hasActiveFilters = query || category || priceRange[0] > 0 || priceRange[1] < 500;

  // Filter listings with coordinates for map view
  const listingsWithCoords = listings.filter(l => l.latitude && l.longitude);

  return (
    <div className="page-enter min-h-screen" data-testid="search-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
              <Input
                type="text"
                placeholder="Search for items..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border-stone-200"
                data-testid="search-input"
              />
            </div>
          </form>

          <div className="flex gap-2">
            <Select value={category || "all"} onValueChange={(val) => setCategory(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[180px] h-12 rounded-xl" data-testid="category-select">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-12 px-4 rounded-xl border-stone-200"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="filters-toggle"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>

            {/* View Toggle */}
            <div className="flex rounded-xl border border-stone-200 overflow-hidden">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                className={`h-12 px-4 rounded-none ${viewMode === 'list' ? 'bg-stone-900' : ''}`}
                onClick={() => setViewMode('list')}
                data-testid="list-view-btn"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                className={`h-12 px-4 rounded-none ${viewMode === 'map' ? 'bg-stone-900' : ''}`}
                onClick={() => setViewMode('map')}
                data-testid="map-view-btn"
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900 font-heading">Filters</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-stone-500 hover:text-stone-700"
                  data-testid="clear-filters-btn"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-3 block">
                  Price per day: ${priceRange[0]} - ${priceRange[1]}+
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={500}
                  step={10}
                  className="w-full"
                  data-testid="price-slider"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-3 block">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="City or area..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Quick Links - only show if no filters */}
        {!category && !query && viewMode === 'list' && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-stone-900 mb-4 font-heading">
              Browse categories
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-4">
              {categories.slice(0, 10).map((cat) => (
                <CategoryCard key={cat.id} category={cat} variant="compact" />
              ))}
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900 font-heading">
            {hasActiveFilters ? (
              <>
                {listings.length} result{listings.length !== 1 ? 's' : ''}
                {query && ` for "${query}"`}
                {category && ` in ${categories.find((c) => c.id === category)?.name}`}
              </>
            ) : (
              'All listings'
            )}
          </h2>
          {viewMode === 'map' && listingsWithCoords.length < listings.length && (
            <span className="text-sm text-stone-500">
              {listingsWithCoords.length} of {listings.length} shown on map
            </span>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#E05D44]" />
          </div>
        ) : viewMode === 'map' ? (
          /* Map View */
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Listings sidebar */}
            <div className="lg:col-span-2 space-y-4 max-h-[600px] overflow-y-auto hide-scrollbar">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => setSelectedListing(listing)}
                  className={`cursor-pointer transition-all ${
                    selectedListing?.id === listing.id
                      ? 'ring-2 ring-[#E05D44] rounded-2xl'
                      : ''
                  }`}
                >
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="lg:col-span-3 h-[600px] rounded-2xl overflow-hidden border border-stone-200">
              {listingsWithCoords.length > 0 ? (
                <ListingsMap
                  listings={listingsWithCoords}
                  selectedListing={selectedListing}
                  onSelectListing={setSelectedListing}
                />
              ) : (
                <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                  <div className="text-center">
                    <Map className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-500">No listings with location data</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : listings.length > 0 ? (
          /* List View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2 font-heading">
              No listings found
            </h3>
            <p className="text-stone-600 mb-6">
              Try adjusting your search or filters
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="rounded-full"
                data-testid="clear-search-btn"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
