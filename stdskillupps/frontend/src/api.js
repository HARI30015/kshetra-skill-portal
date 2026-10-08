import axios from 'axios';
import { supabase } from './supabaseClient';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the Supabase session JWT as a Bearer token on every request.
api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// ---- Profiles ----
export const getMyProfile = () => api.get('/profiles/me').then((r) => r.data);
export const createProfile = (payload) => api.post('/profiles', payload).then((r) => r.data);
export const getAllProfiles = () => api.get('/profiles').then((r) => r.data);
export const updateProfile = (id, payload) => api.put(`/profiles/${id}`, payload).then((r) => r.data);

// ---- Stats ----
export const syncStats = (profileId) => api.post(`/stats/sync/${profileId}`).then((r) => r.data);
export const getStats = (profileId) => api.get(`/stats/${profileId}`).then((r) => r.data);

// ---- Recommendations ----
export const generateRecommendation = (profileId) =>
  api.post(`/recommendations/generate/${profileId}`).then((r) => r.data);
export const getRecommendation = (profileId) =>
  api.get(`/recommendations/${profileId}`).then((r) => r.data);

// ---- Placements ----
export const getPlacements = (params = {}) =>
  api.get('/placements', { params }).then((r) => r.data);
export const createPlacement = (payload) => api.post('/placements', payload).then((r) => r.data);
export const updatePlacement = (id, payload) =>
  api.put(`/placements/${id}`, payload).then((r) => r.data);
export const deletePlacement = (id) => api.delete(`/placements/${id}`).then((r) => r.data);

// ---- Health ----
export const getHealth = () => api.get('/health').then((r) => r.data);
