// Backend API client for local Node.js server
// Replaces Supabase client calls with local API calls

(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  // Configuration for local backend
  const BACKEND_CONFIG = {
    baseUrl: 'http://localhost:4000',
    apiPrefix: '/api'
  };

  // Helper function to make API requests
  async function apiRequest(endpoint, options = {}) {
    const url = `${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.apiPrefix}${endpoint}`;

    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add body for POST/PUT requests
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    // Add authorization header if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth API methods
  ns.authApi = {
    async signUp(email, password, fullName) {
      return await apiRequest('/auth/register', {
        method: 'POST',
        body: { email, password, name: fullName }
      });
    },

    async signIn(email, password) {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      // Store token if login successful
      if (response.data && response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      return response;
    },

    async signOut() {
      localStorage.removeItem('auth_token');
      return { success: true };
    },

    async getCurrentUser() {
      try {
        const response = await apiRequest('/auth/verify-token', {
          method: 'POST'
        });
        return response.data;
      } catch (error) {
        return null;
      }
    }
  };

  // Catalog API methods (products)
  ns.catalogApi = {
    async searchProducts(params = {}) {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.append('query', params.query);
      if (params.categorySlug) queryParams.append('category', params.categorySlug);
      if (params.page) queryParams.append('page', params.page);
      if (params.pageSize) queryParams.append('limit', params.pageSize);

      const response = await apiRequest(`/products/search?${queryParams}`);
      return {
        items: response.data || [],
        page: params.page || 1,
        pageSize: params.pageSize || 12
      };
    },

    async getProductBySlug(slug) {
      const response = await apiRequest(`/products/${slug}`);
      return response.data;
    },

    async getCategories() {
      const response = await apiRequest('/products/categories');
      return response.data || [];
    }
  };

  // Blog API methods
  ns.blogApi = {
    async getPosts(params = {}) {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await apiRequest(`/blog/posts?${queryParams}`);
      return response.data || [];
    },

    async getPostBySlug(slug) {
      const response = await apiRequest(`/blog/posts/${slug}`);
      return response.data;
    },

    async submitComment(postId, comment, authorName, authorEmail) {
      return await apiRequest('/blog/comments', {
        method: 'POST',
        body: {
          postId,
          comment,
          authorName,
          authorEmail
        }
      });
    }
  };

  // Forms API methods (inquiries, subscriptions)
  ns.formsApi = {
    async submitInquiry(inquiryData) {
      return await apiRequest('/forms/inquiry', {
        method: 'POST',
        body: inquiryData
      });
    },

    async subscribeToUpdates(email, preferences = {}) {
      return await apiRequest('/forms/subscribe', {
        method: 'POST',
        body: { email, preferences }
      });
    }
  };

  // File upload API methods
  ns.uploadApi = {
    async uploadFile(file, type = 'general') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      return await apiRequest('/upload', {
        method: 'POST',
        headers: {}, // Let browser set content-type for FormData
        body: formData
      });
    }
  };

  // Initialize the API client
  ns.initializeApi = function() {
    console.log('Backend API client initialized for local server at', BACKEND_CONFIG.baseUrl);
  };

  // Legacy compatibility - create a mock Supabase client for existing code
  ns.getSupabaseClient = function() {
    return {
      // Mock methods for compatibility
      auth: {
        signUp: ns.authApi.signUp,
        signInWithPassword: ns.authApi.signIn,
        signOut: ns.authApi.signOut,
        getUser: ns.authApi.getCurrentUser
      },
      from: function(table) {
        return {
          select: function(columns) {
            return {
              eq: function(column, value) {
                return {
                  single: async function() {
                    // Mock implementation - would need specific logic per table
                    console.warn('Mock Supabase query:', table, columns, column, value);
                    return { data: null, error: null };
                  }
                };
              }
            };
          }
        };
      },
      rpc: function(functionName, params) {
        // Mock RPC calls - would need specific implementations
        console.warn('Mock Supabase RPC:', functionName, params);
        return { data: [], error: null };
      }
    };
  };

})(window);