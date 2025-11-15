// src/api.js
// Use environment variable or default to production backend
const API_BASE_URL = 
  (typeof import !== 'undefined' && import.meta?.env?.VITE_INTEGRATIONS_URL) ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://opside-node-api.onrender.com');

const api = {
  login: async () => {
    try {
      console.log('Starting login process...');
      const response = await fetch(`${API_BASE_URL}/api/v1/integrations/amazon/auth/start`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Login response:', data);

      const authUrl = data.auth_url || data.authUrl;

      if (authUrl) {
        window.location.href = authUrl;
      } else {
        console.error('No auth_url in response:', data);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  },
  
  connectAmazon: async () => {
    try {
      console.log('Starting Amazon connection...');
      const response = await fetch(`${API_BASE_URL}/api/v1/integrations/amazon/auth/start`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Connect Amazon response:', data);

      const authUrl = data.auth_url || data.authUrl;

      if (authUrl) {
        window.location.href = authUrl;
      } else {
        console.error('No auth_url in response:', data);
      }
    } catch (error) {
      console.error('Connect Amazon failed:', error);
    }
  },
  
  getMetrics: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/metrics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get metrics failed:', error);
      return { error: error.message };
    }
  }
};

// Make it available globally
window.api = api;
export default api;
