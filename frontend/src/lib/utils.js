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
  instruments: 'https://images.unsplash.com/photo-1648891216202-c26fed5e5d85?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODh8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMGd1aXRhciUyMG9uJTIwc3RhbmR8ZW58MHx8fHwxNzcwMTYyNDMxfDA&ixlib=rb-4.1.0&q=85',
  tools: 'https://images.unsplash.com/photo-1658845345529-0a6b4f2fa0b0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGRyaWxsJTIwb24lMjB3b3JrYmVuY2h8ZW58MHx8fHwxNzcwMTYyNDM2fDA&ixlib=rb-4.1.0&q=85',
  party: 'https://images.unsplash.com/photo-1653569397345-762ee0f4579e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxkaiUyMGNvbnRyb2xsZXIlMjBwYXJ0eSUyMGxpZ2h0c3xlbnwwfHx8fDE3NzAxNjI0NDB8MA&ixlib=rb-4.1.0&q=85',
  outdoors: 'https://images.unsplash.com/photo-1633803504744-1b8a284cd3cc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxjYW1waW5nJTIwdGVudCUyMGluJTIwZm9yZXN0fGVufDB8fHx8MTc3MDE2MjQ0NXww&ixlib=rb-4.1.0&q=85',
  electronics: 'https://images.unsplash.com/photo-1623266997167-bf4d92ef42fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwxfHxkc2xyJTIwY2FtZXJhJTIwbGVucyUyMGtpdHxlbnwwfHx8fDE3NzAxNjI0NDl8MA&ixlib=rb-4.1.0&q=85',
  vehicles: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
  sports: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
  kitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
  garden: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
  other: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
};
