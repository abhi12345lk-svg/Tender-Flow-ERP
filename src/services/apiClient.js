/**
 * Centralized Frontend API Client for TenderFlow ERP
 * Configurable via VITE_API_BASE_URL environment variable
 */

const RAW_API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000/api/v1';
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
const HEALTH_URL = API_BASE_URL.replace(/\/v1\/?$/, '/health');

/**
 * Core HTTP Request Wrapper
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Attach token from sessionStorage if present
  const token = sessionStorage.getItem('tenderflow_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include HttpOnly cookies
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = result?.message || result?.error || `HTTP Error ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.details = result?.details || null;
      throw err;
    }

    return result;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const networkError = new Error('Backend server is currently offline or unreachable at ' + API_BASE_URL);
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw err;
  }
}

/**
 * Helper to download binary files with authorization
 */
async function downloadBlob(endpoint, defaultFilename = 'download') {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {};
  const token = sessionStorage.getItem('tenderflow_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.message || `Download failed with HTTP ${response.status}`);
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const disposition = response.headers.get('content-disposition');
    let filename = defaultFilename;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '').trim();
      }
    }

    // Inspect genuine document payload format based on Content-Type header:
    // Only use .docx if the returned content is genuinely OpenXML DOCX.
    // HTML-based Word documents (application/msword or text/html) MUST remain .doc or .html
    // because giving an HTML document a .docx extension causes Word to fail with XML parsing / zip errors.
    const isDocx = contentType.includes('vnd.openxmlformats-officedocument.wordprocessingml.document');
    const isMsWord = contentType.includes('application/msword') || contentType.includes('text/html');

    if (filename.toLowerCase().endsWith('.docx') && !isDocx && isMsWord) {
      filename = filename.replace(/\.docx$/i, '.doc');
    } else if (!filename.includes('.')) {
      if (isDocx) {
        filename += '.docx';
      } else if (isMsWord) {
        filename += '.doc';
      } else if (contentType.includes('application/pdf')) {
        filename += '.pdf';
      }
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
    return { success: true, filename };
  } catch (err) {
    console.error('File download error:', err);
    throw err;
  }
}

/**
 * Helper to upload multipart/form-data with authorization
 */
async function uploadFormData(endpoint, formData) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {};
  const token = sessionStorage.getItem('tenderflow_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.message || `Upload failed with HTTP ${response.status}`);
    }
    return result;
  } catch (err) {
    console.error('File upload error:', err);
    throw err;
  }
}

export const api = {
  // System Health
  health: {
    check: async () => {
      try {
        const res = await fetch(HEALTH_URL);
        return await res.json();
      } catch (err) {
        return { status: 'offline', message: err.message };
      }
    },
  },

  // Authentication
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    getMe: () => request('/auth/me', { method: 'GET' }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    setupAdmin: (data) => request('/auth/setup-initial-admin', { method: 'POST', body: JSON.stringify(data) }),
  },

  // 1. Financial Year
  financialYears: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/financial-years${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/financial-years/${id}`),
    create: (data) => request('/financial-years', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/financial-years/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/financial-years/${id}`, { method: 'DELETE' }),
    setActive: (id) => request(`/financial-years/${id}/set-active`, { method: 'PATCH' }),
  },

  // 2. Work Order
  workOrders: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/work-orders${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/work-orders/${id}`),
    create: (data) => request('/work-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/work-orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/work-orders/${id}`, { method: 'DELETE' }),
  },

  // 3. Agreement
  agreements: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/agreements${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/agreements/${id}`),
    create: (data) => request('/agreements', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/agreements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/agreements/${id}`, { method: 'DELETE' }),
    downloadDocx: (id, filename) => downloadBlob(`/agreements/${id}/docx`, filename || `Agreement_${id}.doc`),
  },

  // 4. Billing
  billing: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/billing${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/billing/${id}`),
    create: (data) => request('/billing', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/billing/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/billing/${id}`, { method: 'DELETE' }),
  },

  // 5. Subdivision
  subdivisions: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/subdivisions${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/subdivisions/${id}`),
    create: (data) => request('/subdivisions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/subdivisions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/subdivisions/${id}`, { method: 'DELETE' }),
  },

  // 6. FMD / SD
  fmdSd: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/fmd-sd${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/fmd-sd/${id}`),
    create: (data) => request('/fmd-sd', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/fmd-sd/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/fmd-sd/${id}`, { method: 'DELETE' }),
    uploadFile: (id, file) => {
      const fd = new FormData();
      fd.append('file', file);
      return uploadFormData(`/fmd-sd/${id}/upload`, fd);
    },
    addDocument: (id, docData) => request(`/fmd-sd/${id}/documents`, { method: 'POST', body: JSON.stringify(docData) }),
    deleteDocument: (id, docId) => request(`/fmd-sd/${id}/documents/${docId}`, { method: 'DELETE' }),
    downloadDocument: (id, docId, filename) =>
      downloadBlob(`/fmd-sd/${id}/documents/${docId}/download`, filename || `Security_Doc_${docId}`),
    downloadDocx: (id, lang = 'en', filename) =>
      downloadBlob(`/fmd-sd/${id}/docx?lang=${lang}`, filename || `FMD_Security_Certificate_${id}.doc`),
    getViewUrl: (id, docId) => `${API_BASE_URL}/fmd-sd/${id}/documents/${docId}/view`,
  },
};
