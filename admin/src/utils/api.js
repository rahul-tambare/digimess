import axios from 'axios';

// Since the backend runs on port 5000:
// API URL depending on mode
const API_URL = import.meta.env.PROD 
  ? 'https://api.rahultambare.click/api' 
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
