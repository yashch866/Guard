// Configuration - Detect if running in packaged app vs development
const isPackaged = window.location.protocol === 'file:';

// Function to get the current machine's IP address for network access
const getCurrentIP = () => {
  // When running as packaged app, use localhost
  if (isPackaged) {
    return '127.0.0.1';
  }
  
  // For development, try to detect the actual IP
  // This would need to be set dynamically or manually updated
  const JETSON_IP = '192.168.0.101'; // Update this to match your Jetson's IP for remote access
  return JETSON_IP;
};

// Get the current host - this will work for both localhost and network access
const HOST = getCurrentIP();

export const API_URL = `http://${HOST}:5000`;
export const WS_URL = `ws://${HOST}:5000`;

// Function to make the backend accessible from any network interface
export const getNetworkAccessibleConfig = () => {
  // When the app is running, it should bind to 0.0.0.0 for network access
  // The frontend needs to know the actual IP to connect from other devices
  const currentHost = window.location.hostname || HOST;
  return {
    apiUrl: `http://${currentHost}:5000`,
    wsUrl: `ws://${currentHost}:5000`
  };
};

// Get base URL for frontend
export const getFrontendURL = () => {
    return `http://${HOST}:8080`;
};

// Function to get API URL with endpoint
export const getAPIURL = (endpoint: string) => {
    return `${API_URL}${endpoint}`;
};

// Get configuration
export const getConfig = () => ({
    backendUrl: API_URL,
    wsUrl: WS_URL,
    frontendUrl: getFrontendURL(),
});

// Network-aware configuration that adapts based on how the app is accessed
export const getAdaptiveConfig = () => {
    const currentHost = window.location.hostname;
    
    // If accessed via IP address, use that IP for backend connections
    if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
        return {
            apiUrl: `http://${currentHost}:5000`,
            wsUrl: `ws://${currentHost}:5000`
        };
    }
    
    // Otherwise use default configuration
    return {
        apiUrl: API_URL,
        wsUrl: WS_URL
    };
};

export async function getBackendUrl(): Promise<string> {
    try {
        const response = await fetch('/backend-config.json');
        if (!response.ok) {
            throw new Error('Failed to load backend config');
        }
        const config = await response.json();
        return config.apiUrl || 'http://localhost:5000';
    } catch (error) {
        console.error('Error loading backend config:', error);
        return 'http://localhost:5000'; // Fallback URL
    }
}