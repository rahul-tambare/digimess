import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as NavigationService from './navigation';

// Use production URL if available
const BASE_URL = !__DEV__
  ? 'https://api.rahultambare.click/api'
  : 'http://10.128.30.26:5000/api';

console.log('API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Helper to handle storage for different platforms
const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('token');
    }
    return await SecureStore.getItemAsync('token');
  } catch (err) {
    console.error('Error fetching token:', err);
    return null;
  }
};

export const saveToken = async (token) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('token', token);
    } else {
      await SecureStore.setItemAsync('token', token);
    }
  } catch (err) {
    console.error('Error saving token:', err);
  }
};

export const removeToken = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem('token');
    } else {
      await SecureStore.deleteItemAsync('token');
    }
  } catch (err) {
    console.error('Error removing token:', err);
  }
};

// Attach JWT token to every request if available
api.interceptors.request.use(async (config) => {
  try {
    console.log('Interceptor: fetching token...');
    const token = await getToken();
    console.log('Interceptor: token found:', !!token);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (err) {
    console.warn('Interceptor: SecureStore error', err);
  }
  return config;
}, (error) => {
  console.error('Interceptor Request Error:', error);
  return Promise.reject(error);
});

// Handle Response Errors (especially 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Clearing token.');
      await removeToken();
      NavigationService.reset('Login');
    }
    return Promise.reject(error);
  }
);

export default api;
