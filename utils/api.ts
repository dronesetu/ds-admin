import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const token = Cookies.get('admin_token');
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Format body
  let bodyContent = options.body;
  if (bodyContent && !(bodyContent instanceof FormData) && typeof bodyContent === 'object') {
    headers.set('Content-Type', 'application/json');
    bodyContent = JSON.stringify(bodyContent);
  }

  let url = `${API_BASE_URL}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, val);
      }
    });
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: bodyContent,
    });

    if (response.status === 401) {
      // Clear token if unauthorized
      Cookies.remove('admin_token');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const data = await response.json().catch(() => ({ success: false, message: 'Invalid response format' }));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data as ApiResponse<T>;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  get: <T = any>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'GET' }),
  post: <T = any>(url: string, body?: any, options?: RequestOptions) => request<T>(url, { ...options, method: 'POST', body }),
  put: <T = any>(url: string, body?: any, options?: RequestOptions) => request<T>(url, { ...options, method: 'PUT', body }),
  patch: <T = any>(url: string, body?: any, options?: RequestOptions) => request<T>(url, { ...options, method: 'PATCH', body }),
  delete: <T = any>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'DELETE' }),
};
