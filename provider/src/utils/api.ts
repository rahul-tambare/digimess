import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isProductionDomain = typeof window !== 'undefined' && window.location.hostname.includes('rahultambare.click');

const BASE_URL = (!__DEV__ || isProductionDomain)
  ? 'https://api.rahultambare.click/api'
  : 'http://localhost:5000/api'; // Local dev backend

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const getToken = async () => {
  try {
    if (Platform.OS === 'web') return localStorage.getItem('token');
    return await SecureStore.getItemAsync('token');
  } catch (err) {
    console.error('Error fetching token:', err);
    return null;
  }
};

export const saveToken = async (token: string) => {
  try {
    if (Platform.OS === 'web') localStorage.setItem('token', token);
    else await SecureStore.setItemAsync('token', token);
  } catch (err) {
    console.error('Error saving token:', err);
  }
};

export const removeToken = async () => {
  try {
    if (Platform.OS === 'web') localStorage.removeItem('token');
    else await SecureStore.deleteItemAsync('token');
  } catch (err) {
    console.error('Error removing token:', err);
  }
};

api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (err) {
    console.warn('Interceptor error', err);
  }
  return config;
});

export default api;
