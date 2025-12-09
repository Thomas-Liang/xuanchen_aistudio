import { GenerationConfig, ApiResponse } from '../types';

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g. "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const generateImage = async (config: GenerationConfig): Promise<ApiResponse> => {
  // Trim whitespace from API key to prevent "API key not valid" errors
  const envKey = process.env.API_KEY;
  const apiKey = (config.apiKey || envKey || '').trim();

  if (!apiKey) {
    throw new Error("API Key is missing. Please enter it in the settings or bind it in the environment.");
  }

  // Clean the base URL to remove trailing slashes
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  
  // Detect if we are using Google's Official API
  const isGoogle = baseUrl.includes('googleapis.com');

  if (isGoogle) {
    // ==========================================
    // GOOGLE NATIVE IMPLEMENTATION
    // ==========================================
    
    // Safety check: Banana models don't exist on Google Official API
    if (config.model.toLowerCase().includes('banana')) {
      throw new Error("Impossible Configuration: 'Banana' models are not available on the official Google API. Please switch to 'Custom' or 'OpenRouter' in API Settings, or select a valid Google model.");
    }

    // 1. Prepare Endpoint
    // Strip 'models/' prefix if present for the URL construction, as the endpoint format is /v1beta/models/{id}:generateContent
    const modelId = config.model.replace(/^models\//, '');
    const endpoint = `${baseUrl}/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    // 2. Prepare Payload
    const parts: any[] = [{ text: config.prompt }];

    // Handle reference images (Files)
    if (config.files && config.files.length > 0) {
      for (const file of config.files) {
        const base64Data = await fileToBase64(file);
        parts.push({
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        });
      }
    }

    const payload: any = {
      contents: [{ parts }],
      generationConfig: {
        // Map our config to Google's imageConfig
        imageConfig: {
          aspectRatio: config.aspectRatio,
          imageSize: config.imageSize,
        }
      }
    };

    // 3. Execute Request
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Google API Error ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error && errorJson.error.message) {
            errorMsg = errorJson.error.message;
          }
        } catch (e) {
          // Fallback to raw text if JSON parse fails
          errorMsg += `: ${errorText.substring(0, 200)}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      // 4. Parse Google Response
      // Look for the image in the candidates
      const candidates = data.candidates || [];
      const contentParts = candidates[0]?.content?.parts || [];
      const imagePart = contentParts.find((p: any) => p.inlineData);

      if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
         return {
           data: [{ b64_json: imagePart.inlineData.data }]
         };
      }

      // If no image found, check for failure reasons
      if (candidates[0]?.finishReason && candidates[0]?.finishReason !== 'STOP') {
        throw new Error(`Generation stopped: ${candidates[0].finishReason}`);
      }
      
      throw new Error("No image data found in Google response.");

    } catch (error: any) {
      console.error("Google API Call Failed:", error);
      throw new Error(error.message || "Google API request failed");
    }

  } else {
    // ==========================================
    // OPENAI COMPATIBLE IMPLEMENTATION (Proxy/OpenRouter)
    // ==========================================

    // Determine if this is a Generation (Text-to-Image) or Edit (Image-to-Image)
    const hasFiles = config.files && config.files.length > 0;
    
    // Endpoint selection: /generations for text-only, /edits for image inputs
    const endpoint = hasFiles 
      ? `${baseUrl}/v1/images/edits` 
      : `${baseUrl}/v1/images/generations`;

    let headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
    };

    let body: FormData | string;

    // Helper to determine if we should send image_size
    // Only send image_size for official Gemini Pro Image Preview models that explicitly support it.
    // We exclude 'banana' models to prevent 500 errors on the proxy.
    const isBanana = config.model.toLowerCase().includes('banana');
    const shouldSendSize = !isBanana && config.imageSize && (
      config.model.toLowerCase().includes('gemini-3-pro-image-preview') || 
      config.model.toLowerCase().includes('hd')
    );

    if (hasFiles) {
      // --- Image Editing / Reference (FormData) ---
      const formData = new FormData();
      formData.append('model', config.model);
      formData.append('prompt', config.prompt);
      formData.append('response_format', 'b64_json');
      formData.append('aspect_ratio', config.aspectRatio);
      
      if (shouldSendSize) {
        formData.append('image_size', config.imageSize);
      }

      // Append files
      config.files.forEach((file) => {
        formData.append('image', file);
      });

      body = formData;
      // Note: Content-Type header is excluded for FormData so browser sets boundary
    } else {
      // --- Text to Image Generation (JSON) ---
      headers['Content-Type'] = 'application/json';
      
      const payload: any = {
        model: config.model,
        prompt: config.prompt,
        response_format: 'b64_json',
        aspect_ratio: config.aspectRatio,
      };

      if (shouldSendSize) {
        payload.image_size = config.imageSize;
      }

      body = JSON.stringify(payload);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.error?.message) {
            errorMsg = errorData.error.message;
          } else if (typeof errorData === 'string') {
            errorMsg = errorData;
          }
        } catch (e) {
          // failed to parse json error, try text
          const text = await response.text().catch(() => '');
          if (text) {
              // Truncate long HTML error responses often returned by proxies/gateways
              const cleanedText = text.replace(/<[^>]*>/g, '').substring(0, 200);
              errorMsg += ` - ${cleanedText}`;
          }
        }
        throw new Error(errorMsg);
      }

      const data: ApiResponse = await response.json();
      return data;
    } catch (error: any) {
      console.error("API Call Failed:", error);
      throw new Error(error.message || "Network request failed");
    }
  }
};