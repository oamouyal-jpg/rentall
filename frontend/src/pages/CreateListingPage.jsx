import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, categoriesAPI, uploadAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Loader2, Upload, X, MapPin, Image as ImageIcon, DollarSign, Clock, Calendar, CalendarRange } from 'lucide-react';

export default function CreateListingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  
  // Flexible pricing
  const [enableHourly, setEnableHourly] = useState(false);
  const [enableDaily, setEnableDaily] = useState(true);
  const [enableWeekly, setEnableWeekly] = useState(false);
  const [pricePerHour, setPricePerHour] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricePerWeek, setPricePerWeek] = useState('');
  const [minHours, setMinHours] = useState('1');
  const [minDays, setMinDays] = useState('1');
  
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [images, setImages] = useState([]);
  const [damageDeposit, setDamageDeposit] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    categoriesAPI.getAll().then((res) => setCategories(res.data));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        () => {}
      );
    }
  }, []);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploading(true);

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Data = event.target.result;
          
          try {
            const res = await uploadAPI.uploadImage({
              image_data: base64Data,
              filename: file.name,
            });
            
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
            const imageUrl = `${backendUrl}${res.data.url}`;
            setImages((prev) => [...prev, imageUrl]);
          } catch (err) {
            console.error('Upload error:', err);
            toast.error(`Failed to upload ${file.name}`);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('File read error:', err);
      }
    }

    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    // Validate at least one pricing option is enabled and has a value
    const hasHourlyPrice = enableHourly && pricePerHour && parseFloat(pricePerHour) > 0;
    const hasDailyPrice = enableDaily && pricePerDay && parseFloat(pricePerDay) > 0;
    const hasWeeklyPrice = enableWeekly && pricePerWeek && parseFloat(pricePerWeek) > 0;

    if (!hasHourlyPrice && !hasDailyPrice && !hasWeeklyPrice) {
      toast.error('Please set at least one pricing option');
      return;
    }

    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setLoading(true);

    try {
      const listingData = {
        title,
        description,
        category,
        price_per_hour: hasHourlyPrice ? parseFloat(pricePerHour) : null,
        price_per_day: hasDailyPrice ? parseFloat(pricePerDay) : null,
        price_per_week: hasWeeklyPrice ? parseFloat(pricePerWeek) : null,
        min_rental_hours: enableHourly ? parseInt(minHours) || 1 : 1,
        min_rental_days: enableDaily ? parseInt(minDays) || 1 : 1,
        location,
        latitude,
        longitude,
        images,
        damage_deposit: damageDeposit ? parseFloat(damageDeposit) : 0,
      };

      const res = await listingsAPI.create(listingData);
      toast.success('Listing created!');
      navigate(`/listing/${res.data.id}`);
    } catch (error) {
      console.error('Create listing error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E05D44]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-enter min-h-screen pb-12" data-testid="create-listing-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 font-heading">
            List an item
          </h1>
          <p className="text-stone-600 mt-2">
            Share your stuff and start earning. You keep 95% of every rental.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Upload */}
          <div className="space-y-2">
            <Label>Photos</Label>
            <p className="text-sm text-stone-500 mb-2">
              Add up to 5 photos. First photo will be the cover image.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 group">
                  <img
                    src={img}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                      Cover
                    </span>
                  )}
                </div>
              ))}
              
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-stone-300 hover:border-[#E05D44] hover:bg-[#E05D44]/5 flex flex-col items-center justify-center gap-2 transition-colors"
                  data-testid="upload-image-btn"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 text-stone-400" />
                      <span className="text-xs text-stone-500">Add photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What are you renting out?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-12 rounded-xl"
              data-testid="listing-title-input"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="h-12 rounded-xl" data-testid="listing-category-select">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your item, its condition, and any requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="rounded-xl resize-none"
              data-testid="listing-description-input"
            />
          </div>

          {/* Pricing Options */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Pricing Options</Label>
              <p className="text-sm text-stone-500 mt-1">
                Set your rental rates. Enable multiple options to give renters flexibility.
              </p>
            </div>
            
            {/* Hourly Rate */}
            <div className="bg-stone-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-stone-500" />
                  <Label htmlFor="hourly-toggle" className="font-medium">Hourly rate</Label>
                </div>
                <Switch
                  id="hourly-toggle"
                  checked={enableHourly}
                  onCheckedChange={setEnableHourly}
                  data-testid="hourly-toggle"
                />
              </div>
              {enableHourly && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label className="text-xs text-stone-500">Price per hour</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="25.00"
                        value={pricePerHour}
                        onChange={(e) => setPricePerHour(e.target.value)}
                        className="h-10 pl-9 rounded-lg"
                        data-testid="price-per-hour-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Minimum hours</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={minHours}
                      onChange={(e) => setMinHours(e.target.value)}
                      className="h-10 rounded-lg mt-1"
                      data-testid="min-hours-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Daily Rate */}
            <div className="bg-stone-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-stone-500" />
                  <Label htmlFor="daily-toggle" className="font-medium">Daily rate</Label>
                </div>
                <Switch
                  id="daily-toggle"
                  checked={enableDaily}
                  onCheckedChange={setEnableDaily}
                  data-testid="daily-toggle"
                />
              </div>
              {enableDaily && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label className="text-xs text-stone-500">Price per day</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="75.00"
                        value={pricePerDay}
                        onChange={(e) => setPricePerDay(e.target.value)}
                        className="h-10 pl-9 rounded-lg"
                        data-testid="price-per-day-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Minimum days</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={minDays}
                      onChange={(e) => setMinDays(e.target.value)}
                      className="h-10 rounded-lg mt-1"
                      data-testid="min-days-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Rate */}
            <div className="bg-stone-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-stone-500" />
                  <Label htmlFor="weekly-toggle" className="font-medium">Weekly rate</Label>
                  <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Save more</span>
                </div>
                <Switch
                  id="weekly-toggle"
                  checked={enableWeekly}
                  onCheckedChange={setEnableWeekly}
                  data-testid="weekly-toggle"
                />
              </div>
              {enableWeekly && (
                <div className="pt-2">
                  <Label className="text-xs text-stone-500">Price per week</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="400.00"
                      value={pricePerWeek}
                      onChange={(e) => setPricePerWeek(e.target.value)}
                      className="h-10 pl-9 rounded-lg"
                      data-testid="price-per-week-input"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Damage Deposit */}
          <div className="space-y-2">
            <Label htmlFor="deposit">Damage deposit (optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                id="deposit"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={damageDeposit}
                onChange={(e) => setDamageDeposit(e.target.value)}
                className="h-12 pl-11 rounded-xl"
                data-testid="listing-deposit-input"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                id="location"
                placeholder="City, State"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="h-12 pl-11 rounded-xl"
                data-testid="listing-location-input"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-[#8DA399]/10 border border-[#8DA399]/20 rounded-xl p-4">
            <h3 className="font-medium text-stone-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-stone-600 space-y-1">
              <li>• Your listing will be live immediately</li>
              <li>• Renters can message you or book directly</li>
              <li>• You'll receive 95% of each booking (we take 5%)</li>
              <li>• Payouts are processed after rental completion</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading || images.length === 0}
              className="w-full h-12 rounded-full bg-[#E05D44] hover:bg-[#C54E36] btn-press"
              data-testid="create-listing-submit-btn"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create listing
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
