import { SupportedPlatform } from '../config';

/**
 * Generic API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * User profile interface
 */
export interface UserProfile {
  userId: string;
  username: string;
  url?: string;
  profileImageUrl: string;
  isPremium?: boolean;
  platform: string;
  lastUpdated: number; // timestamp
}

/**
 * Platform account interface
 */
export interface PlatformAccount {
  platform: SupportedPlatform;
  userId: string;
  username: string;
  profileImageUrl?: string;
  profile?: UserProfile;
}

/**
 * Post target interface
 */
export interface PostTarget {
  platform: SupportedPlatform;
  userId: string;
}

/**
 * Post media interface
 */
export interface PostMedia {
  data: string; // Base64 encoded data or URL
  mimeType: string;
  altText?: string;
}

/**
 * Post content interface
 */
export interface PostContent {
  text: string;
  media?: PostMedia[];
  mediaId?: string | null;
  mediaPreview?: string | null;
}

/**
 * Post request interface
 */
export interface PostRequest {
  targets: PostTarget[];
  content: PostContent[];
}
