import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, categoriesAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Loader2, Upload, X, MapPin } from 'lucide-react';

export default function CreateListingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [images, setImages] = useState(['']);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    categoriesAPI.getAll().then((res) => setCategories(res.data));

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        () => {
          // Use default NYC coordinates
        }
      );
    }
  }, []);

  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const addImageField = () => {
    if (images.length < 5) {
      setImages([...images, '']);
    }
  };

  const removeImageField = (index) => {
    if (images.length > 1) {
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    const price = parseFloat(pricePerDay);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setLoading(true);

    try {
      const listingData = {
        title,
        description,
        category,
        price_per_day: price,
        location,
        latitude,
        longitude,
        images: images.filter((img) => img.trim() !== ''),
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
            Share your stuff and start earning
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <SelectContent>
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

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price per day ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="25.00"
              value={pricePerDay}
              onChange={(e) => setPricePerDay(e.target.value)}
              required
              className="h-12 rounded-xl"
              data-testid="listing-price-input"
            />
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

          {/* Images */}
          <div className="space-y-2">
            <Label>Image URLs</Label>
            <p className="text-sm text-stone-500 mb-2">
              Add up to 5 image URLs for your listing
            </p>
            <div className="space-y-3">
              {images.map((img, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <Upload className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={img}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      className="h-12 pl-11 rounded-xl"
                      data-testid={`listing-image-input-${index}`}
                    />
                  </div>
                  {images.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeImageField(index)}
                      className="h-12 w-12 rounded-xl shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {images.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImageField}
                  className="w-full h-12 rounded-xl border-dashed"
                  data-testid="add-image-btn"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add another image
                </Button>
              )}
            </div>
          </div>

          {/* Preview */}
          {images.filter((img) => img.trim()).length > 0 && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="grid grid-cols-3 gap-2">
                {images
                  .filter((img) => img.trim())
                  .map((img, index) => (
                    <div key={index} className="aspect-square rounded-xl overflow-hidden bg-stone-100">
                      <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400';
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
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
