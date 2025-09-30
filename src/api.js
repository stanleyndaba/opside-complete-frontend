// src/api.js
const API_BASE_URL = 'https://clario-complete-backend-y5cd.onrender.com';

const api = {
  login: async () => {
    try {
      console.log('Starting login process...');
      const response = await fetch(\\/auth/amazon/start\);
      
      if (!response.ok) {
        throw new Error(\HTTP error! status: \\);
      }
      
      const data = await response.json();
      console.log('Login response:', data);
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        console.error('No authUrl in response:', data);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  },
  
  connectAmazon: async () => {
    try {
      console.log('Starting Amazon connection...');
      const response = await fetch(\\/auth/amazon/start\);
      
      if (!response.ok) {
        throw new Error(\HTTP error! status: \\);
      }
      
      const data = await response.json();
      console.log('Connect Amazon response:', data);
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        console.error('No authUrl in response:', data);
      }
    } catch (error) {
      console.error('Connect Amazon failed:', error);
    }
  },
  
  getMetrics: async () => {
    try {
      const response = await fetch(\\/metrics\);
      
      if (!response.ok) {
        throw new Error(\HTTP error! status: \\);
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
