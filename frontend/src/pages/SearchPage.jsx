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
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState([0, 500]);

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
    setSearchParams({});
  };

  const hasActiveFilters = query || category || priceRange[0] > 0 || priceRange[1] < 500;

  return (
    <div className="page-enter min-h-screen" data-testid="search-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
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
              <SelectContent>
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
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
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

            <div className="space-y-6">
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
            </div>
          </div>
        )}

        {/* Categories Quick Links */}
        {!category && !query && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-stone-900 mb-4 font-heading">
              Browse categories
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-4">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} variant="compact" />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-6">
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
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#E05D44]" />
            </div>
          ) : listings.length > 0 ? (
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
    </div>
  );
}
