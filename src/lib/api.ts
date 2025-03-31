import { OPEN_CROSSPOST_PROXY_API, SupportedPlatform } from '../config';
import { getCurrentAuthData } from './auth/near-auth';

// Types for API requests and responses
export interface PlatformAccount {
  platform: SupportedPlatform;
  userId: string;
  username: string;
  profileImageUrl?: string;
  isConnected: boolean;
}

export interface PostTarget {
  platform: SupportedPlatform;
  userId: string;
}

export interface PostMedia {
  data: string; // Base64 encoded data or URL
  mimeType: string;
  altText?: string;
}

export interface PostContent {
  text: string;
  media?: PostMedia[];
}

export interface PostRequest {
  targets: PostTarget[];
  content: PostContent[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// API client functions

/**
 * Get headers with NEAR authentication
 * @returns Headers object with Authorization header if authenticated
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const authData = getCurrentAuthData();
  if (authData) {
    // Format the header correctly - this was causing the 401 errors
    headers['Authorization'] = `Bearer ${JSON.stringify(authData)}`;
  }
  
  return headers;
}

/**
 * Fetch all connected accounts for the authenticated NEAR user
 */
export async function fetchConnectedAccounts(): Promise<ApiResponse<PlatformAccount[]>> {
  try {
    const response = await fetch(`${OPEN_CROSSPOST_PROXY_API}/auth/accounts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    // Handle nested data structure: { data: { accounts: [...] } }
    const accounts = responseData.data?.accounts || [];
    
    // Add default values for missing fields
    const enhancedAccounts = accounts.map((account: any) => ({
      platform: account.platform,
      userId: account.userId,
      username: account.username || `user_${account.userId.substring(0, 8)}`, // Generate a username if missing
      profileImageUrl: account.profileImageUrl,
      isConnected: account.isConnected !== false, // Default to true if not specified
    }));

    return {
      success: true,
      data: enhancedAccounts,
    };
  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Initiate the connection flow for a platform account
 */
export async function connectPlatformAccount(
  platform: SupportedPlatform,
  returnUrl: string
): Promise<ApiResponse<{ authUrl: string }>> {
  try {
    const response = await fetch(`${OPEN_CROSSPOST_PROXY_API}/auth/${platform}/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ returnUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    // If successful, redirect to the auth URL
    if (data.authUrl) {
      window.location.href = data.authUrl;
    }

    return {
      success: true,
      data: { authUrl: data.authUrl },
    };
  } catch (error) {
    console.error(`Error connecting ${platform} account:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Disconnect a platform account
 */
export async function disconnectPlatformAccount(
  platform: SupportedPlatform,
  userId: string
): Promise<ApiResponse> {
  try {
    const response = await fetch(`${OPEN_CROSSPOST_PROXY_API}/auth/${platform}/revoke`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error disconnecting ${platform} account:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refresh a platform account's token
 */
export async function refreshPlatformAccount(
  platform: SupportedPlatform,
  userId: string
): Promise<ApiResponse> {
  try {
    const response = await fetch(`${OPEN_CROSSPOST_PROXY_API}/auth/${platform}/refresh`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error refreshing ${platform} account:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check a platform account's status
 */
export async function checkPlatformAccountStatus(
  platform: SupportedPlatform,
  userId: string
): Promise<ApiResponse<{ isConnected: boolean }>> {
  try {
    // Use query parameters instead of body for GET request
    const url = new URL(`${OPEN_CROSSPOST_PROXY_API}/auth/${platform}/status`);
    url.searchParams.append('userId', userId);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data: { isConnected: data.isConnected || false },
    };
  } catch (error) {
    console.error(`Error checking ${platform} account status:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a post on selected platforms
 */
export async function createPost(postRequest: PostRequest): Promise<ApiResponse> {
  try {
    const response = await fetch(`${OPEN_CROSSPOST_PROXY_API}/api/post`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(postRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error creating post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get rate limit status for an endpoint
 */
export async function getRateLimitStatus(endpoint?: string): Promise<ApiResponse> {
  try {
    const url = endpoint
      ? `${OPEN_CROSSPOST_PROXY_API}/api/rate-limit/${endpoint}`
      : `${OPEN_CROSSPOST_PROXY_API}/api/rate-limit`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
