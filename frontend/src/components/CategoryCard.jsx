import { Link } from 'react-router-dom';
import { categoryImages } from '../lib/utils';
import { 
  Music, 
  Wrench, 
  PartyPopper, 
  Tent, 
  Camera, 
  Car, 
  Dumbbell, 
  UtensilsCrossed, 
  Flower2, 
  Package,
  Bike,
  Ship,
  Caravan,
  Tractor,
  HardHat,
  Wheat,
  Hammer,
  Users,
  Truck,
  Sofa,
  Sparkles,
  Speaker,
  Waves,
  Snowflake,
  Laptop,
  Gamepad2,
  Plane,
  Shirt,
  Gem,
  Briefcase,
  Baby,
  PawPrint,
  Warehouse
} from 'lucide-react';

const iconComponents = {
  music: Music,
  wrench: Wrench,
  'party-popper': PartyPopper,
  tent: Tent,
  camera: Camera,
  car: Car,
  dumbbell: Dumbbell,
  utensils: UtensilsCrossed,
  flower: Flower2,
  package: Package,
  bike: Bike,
  bicycle: Bike,
  ship: Ship,
  caravan: Caravan,
  tractor: Tractor,
  'hard-hat': HardHat,
  wheat: Wheat,
  hammer: Hammer,
  users: Users,
  truck: Truck,
  sofa: Sofa,
  sparkles: Sparkles,
  speaker: Speaker,
  waves: Waves,
  snowflake: Snowflake,
  laptop: Laptop,
  gamepad: Gamepad2,
  plane: Plane,
  shirt: Shirt,
  gem: Gem,
  briefcase: Briefcase,
  baby: Baby,
  'paw-print': PawPrint,
  warehouse: Warehouse,
};

export default function CategoryCard({ category, variant = 'default' }) {
  const { id, name, icon } = category;
  const IconComponent = iconComponents[icon] || Package;
  const image = categoryImages[id] || categoryImages.other;

  if (variant === 'compact') {
    return (
      <Link
        to={`/search?category=${id}`}
        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors group"
        data-testid={`category-compact-${id}`}
      >
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
          <IconComponent className="h-6 w-6 text-[#E05D44]" />
        </div>
        <span className="text-sm font-medium text-stone-700 text-center">
          {name}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={`/search?category=${id}`}
      className="category-card relative overflow-hidden rounded-2xl aspect-[4/3] group"
      data-testid={`category-card-${id}`}
    >
      <img
        src={image}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
            <IconComponent className="h-5 w-5 text-[#E05D44]" />
          </div>
          <span className="text-white font-semibold text-lg font-heading">
            {name}
          </span>
        </div>
      </div>
    </Link>
  );
}
