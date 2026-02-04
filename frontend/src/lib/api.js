import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Listings API
export const listingsAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getFeatured: () => api.get('/listings/featured'),
  getMy: () => api.get('/listings/my'),
  getById: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
};

// Bookings API
export const bookingsAPI = {
  getMy: () => api.get('/bookings/my'),
  getRequests: () => api.get('/bookings/requests'),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, null, { params: { status } }),
  getBookedDates: (listingId) => api.get(`/bookings/listing/${listingId}/dates`),
};

// Reviews API
export const reviewsAPI = {
  getByListing: (listingId) => api.get(`/reviews/listing/${listingId}`),
  create: (data) => api.post('/reviews', data),
};

// Messages API
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getWithUser: (userId) => api.get(`/messages/${userId}`),
  send: (data) => api.post('/messages', data),
};

// Payments API
export const paymentsAPI = {
  createCheckout: (data) => api.post('/payments/checkout', data),
  getStatus: (sessionId) => api.get(`/payments/status/${sessionId}`),
};

// Payouts API
export const payoutsAPI = {
  getMy: () => api.get('/payouts/my'),
  getSummary: () => api.get('/payouts/summary'),
  requestPayout: () => api.post('/payouts/request'),
};

// Upload API
export const uploadAPI = {
  uploadImage: (data) => api.post('/upload/image', data),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export default api;
