import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return formatDate(dateString);
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end - start;
  return Math.ceil(diff / 86400000);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function truncate(str, length = 100) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export const categoryIcons = {
  instruments: 'Music',
  tools: 'Wrench',
  party: 'PartyPopper',
  outdoors: 'Tent',
  electronics: 'Camera',
  vehicles: 'Car',
  sports: 'Dumbbell',
  kitchen: 'UtensilsCrossed',
  garden: 'Flower2',
  other: 'Package',
};

export const categoryImages = {
  // Vehicles & Transport
  cars: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
  motorcycles: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800',
  bikes: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800',
  boats: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  caravans: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800',
  // Heavy Equipment
  'heavy-machinery': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  construction: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  farming: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800',
  // Services & Labor
  tradies: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
  manpower: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800',
  drivers: 'https://images.unsplash.com/photo-1449965408869-euj2b46e78e?w=800',
  // Home & Living
  tools: 'https://images.unsplash.com/photo-1658845345529-0a6b4f2fa0b0?w=800',
  kitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
  furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  garden: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
  cleaning: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800',
  // Events & Entertainment
  party: 'https://images.unsplash.com/photo-1653569397345-762ee0f4579e?w=800',
  'audio-visual': 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800',
  instruments: 'https://images.unsplash.com/photo-1648891216202-c26fed5e5d85?w=800',
  photography: 'https://images.unsplash.com/photo-1623266997167-bf4d92ef42fa?w=800',
  // Sports & Recreation
  sports: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
  camping: 'https://images.unsplash.com/photo-1633803504744-1b8a284cd3cc?w=800',
  'water-sports': 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800',
  'winter-sports': 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800',
  // Tech & Electronics
  electronics: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800',
  gaming: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800',
  drones: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800',
  // Fashion & Accessories
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
  jewelry: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
  bags: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
  // Kids & Pets
  baby: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800',
  pets: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800',
  // Other
  storage: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800',
  other: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
};
