// Backend API client for local Node.js server

(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  // Configuration for local backend
  const BACKEND_CONFIG = {
  baseUrl:
    (ns.config && ns.config.baseUrl) ||
    'https://api.cocoabridge.com',

  apiPrefix:
    (ns.config && ns.config.apiPrefix) ||
    '/api'
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

    async submitComment(postIdOrPayload, comment, authorName, authorEmail) {
      const payload =
        postIdOrPayload && typeof postIdOrPayload === 'object'
          ? postIdOrPayload
          : {
              postId: postIdOrPayload,
              comment,
              authorName,
              authorEmail
            };

      const message = payload.message || payload.comment || '';
      const postSlug = payload.postSlug || null;
      const postId = payload.postId || null;

      return await apiRequest('/blog/comments', {
        method: 'POST',
        body: {
          postId,
          postSlug,
          comment: message,
          message,
          authorName: payload.authorName,
          authorEmail: payload.authorEmail,
          sourceChannel: payload.sourceChannel || 'blog_detail'
        }
      });
    }
  };

  // Forms API methods (inquiries, subscriptions)
  ns.formsApi = {
    async submitInquiry(inquiryData) {
      const data = inquiryData || {};
      const source = String(data.sourceChannel || '').toLowerCase();

      // Buyer quote form -> /api/quotes
      if (source === 'buyer_quote_form') {
        return await apiRequest('/quotes', {
          method: 'POST',
          body: {
            company_name: data.companyName || '',
            contact_name: data.contactName || '',
            email: data.workEmail || '',
            phone: data.phoneWhatsApp || '',
            country: data.countryRegion || '',
            product: data.productSlug || data.product || data.inquiryTopic || '',
            quantity: data.requiredVolumeMt || data.quantity || '',
            packaging: data.packaging || '',
            destination_port: data.destinationPort || '',
            message: data.message || ''
          }
        });
      }

      // Contact, export and product inquiries -> /api
      return await apiRequest('/', {
        method: 'POST',
        body: {
          name: data.contactName || '',
          email: data.workEmail || '',
          phone: data.phoneWhatsApp || '',
          subject: data.inquiryTopic || data.productSlug || 'Website Inquiry',
          message: data.message || ''
        }
      });
    },

    async subscribeToUpdates(email, preferences = {}) {
      return await apiRequest('/forms/subscribe', {
        method: 'POST',
        body: { email, preferences }
      });
    }
  };

  ns.inquiryApi = {
    submitInquiry: ns.formsApi.submitInquiry
  };

  ns.subscriptionApi = {
    subscribe(payload) {
      return ns.formsApi.subscribeToUpdates(payload.email, payload);
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

})(window);
