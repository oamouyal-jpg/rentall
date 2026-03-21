import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { formatPrice } from '../lib/utils';

export default function ListingCard({ listing }) {
  const {
    id,
    title,
    images,
    price_per_day,
    location,
    avg_rating,
    review_count,
    category,
    tags = [],
  } = listing;

  return (
    <Link 
      to={`/listing/${id}`}
      className="group listing-card block"
      data-testid={`listing-card-${id}`}
    >
      <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-200 transition-all">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          <img
            src={images?.[0] || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-stone-700 text-xs font-medium px-3 py-1 rounded-full capitalize">
              {category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-stone-900 line-clamp-1 font-heading">
              {title}
            </h3>
            {review_count > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-4 w-4 fill-[#E05D44] text-[#E05D44]" />
                <span className="text-sm font-medium text-stone-900">
                  {avg_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-stone-500 text-sm mb-3">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{location}</span>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs bg-[#E05D44]/10 text-[#E05D44]"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-600">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="flex items-baseline gap-1">
            <span className="font-bold text-stone-900 text-lg">
              {formatPrice(price_per_day)}
            </span>
            <span className="text-stone-500 text-sm">/ day</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
