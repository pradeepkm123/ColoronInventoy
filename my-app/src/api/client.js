import axios from 'axios';

const isVite = typeof import.meta !== 'undefined' && import.meta.env;
const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const baseURL = isLocal
  ? 'http://localhost:5002/api'
  : ((isVite ? import.meta.env?.VITE_API_URL : process.env.REACT_APP_API_URL) ||
      'http://localhost:5002/api');

const client = axios.create({
  baseURL, // '' + '/api/...' => proxied to 5000 in dev if proxy is set
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
