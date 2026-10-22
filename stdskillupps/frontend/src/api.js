import axios from 'axios';
import { supabase } from './supabaseClient';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  // The backend runs on a free tier that sleeps when idle and can take
  // 30-60s to wake. A generous timeout keeps the first request alive
  // instead of failing it while the server is still starting.
  timeout: 70000,
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
export const checkEmailExists = async (email) => {
  // The backend sleeps when idle: the first attempt may fail or time
  // out WHILE waking it. Retry once — the second attempt reaches the
  // awake server. Only a double failure propagates (callers fail open).
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await api.get('/profiles/email-exists', { params: { email } });
      return !!r.data?.exists;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};
export const deleteMyIncompleteProfile = () =>
  api.delete('/profiles/me/incomplete').then((r) => r.data);
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
