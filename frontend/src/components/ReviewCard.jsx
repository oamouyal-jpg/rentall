import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Star } from 'lucide-react';
import { formatRelativeTime, getInitials } from '../lib/utils';

export default function ReviewCard({ review }) {
  const { reviewer_name, reviewer_avatar, rating, comment, created_at } = review;

  return (
    <div className="p-4 bg-white rounded-2xl border border-stone-100" data-testid="review-card">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={reviewer_avatar} alt={reviewer_name} />
          <AvatarFallback className="bg-stone-200 text-stone-600 text-sm">
            {getInitials(reviewer_name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-medium text-stone-900 truncate">
              {reviewer_name}
            </h4>
            <span className="text-xs text-stone-400 shrink-0">
              {formatRelativeTime(created_at)}
            </span>
          </div>
          
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= rating
                    ? 'fill-[#E05D44] text-[#E05D44]'
                    : 'fill-stone-200 text-stone-200'
                }`}
              />
            ))}
          </div>
          
          <p className="text-stone-600 text-sm leading-relaxed">
            {comment}
          </p>
        </div>
      </div>
    </div>
  );
}
