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