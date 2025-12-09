export enum AspectRatio {
  Square = '1:1',
  Portrait23 = '2:3',
  Landscape32 = '3:2',
  Portrait34 = '3:4',
  Landscape43 = '4:3',
  Portrait45 = '4:5',
  Landscape54 = '5:4',
  Portrait916 = '9:16',
  Landscape169 = '16:9',
  Ultrawide219 = '21:9',
}

export enum ImageSize {
  Size1K = '1K',
  Size2K = '2K',
  Size4K = '4K',
}

export interface GenerationConfig {
  baseUrl: string;
  apiKey?: string;
  model: string;
  prompt: string;
  files: File[];
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}

export interface ApiResponse {
  created?: number;
  data?: Array<{
    url?: string;
    b64_json?: string;
    base64?: string; // Support common variation
    image?: string;  // Support common variation
  }>;
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

export interface GenerationResult {
  imageUrl: string | null;
  error: string | null;
  isLoading: boolean;
}

// ===== Member System Types =====

export type MemberRole = 'user' | 'vip' | 'admin';
export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

export interface Member {
  id: string;
  email: string;
  username: string;
  password: string; // In production, this should be hashed
  avatar?: string;
  role: MemberRole;
  plan: PlanType;
  credits: number;
  totalCredits: number;
  createdAt: string;
  lastLoginAt: string;
  expiresAt?: string; // Subscription expiry
  isActive: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  nameZh: string;
  price: number;
  priceYearly: number;
  credits: number;
  features: string[];
  featuresZh: string[];
  popular?: boolean;
}

export interface PaymentRecord {
  id: string;
  memberId: string;
  plan: PlanType;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  method: 'wechat' | 'alipay' | 'card' | 'other';
}

export interface UsageRecord {
  id: string;
  memberId: string;
  type: 'generation' | 'edit' | 'upscale';
  creditsUsed: number;
  prompt?: string;
  model?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  totalGenerations: number;
  newUsersToday: number;
  revenueToday: number;
}