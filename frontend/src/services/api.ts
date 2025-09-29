import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Our backend server URL
});

// Add a request interceptor to automatically add the token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we get a 401, the token is invalid or expired
      localStorage.removeItem('accessToken');
      // We don't use useAuth here as this is not a React component
      // Redirecting is the simplest way to reset the app state
      alert('세션이 만료되었습니다. 다시 로그인해주세요.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
