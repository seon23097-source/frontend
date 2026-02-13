const API_BASE = '/api';

// 토큰 저장/불러오기
export const saveToken = (token) => {
  localStorage.setItem('auth_token', token);
};

export const getToken = () => {
  return localStorage.getItem('auth_token');
};

export const removeToken = () => {
  localStorage.removeItem('auth_token');
};

export const isAuthenticated = () => {
  return !!getToken();
};

// API 호출 헬퍼
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
    throw new Error(error.error || '요청 실패');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  checkSetup: () => apiCall('/auth/check'),
  setup: (password) => apiCall('/auth/setup', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  login: (password) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
};

// Students API
export const studentsAPI = {
  getCount: () => apiCall('/students/count'),
  getAll: (includeInactive = false) => 
    apiCall(`/students?includeInactive=${includeInactive}`),
  bulkCreate: (students) => apiCall('/students/bulk', {
    method: 'POST',
    body: JSON.stringify({ students }),
  }),
  create: (student) => apiCall('/students', {
    method: 'POST',
    body: JSON.stringify(student),
  }),
  update: (id, data) => apiCall(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deactivate: (id) => apiCall(`/students/${id}/deactivate`, {
    method: 'PATCH',
  }),
  activate: (id) => apiCall(`/students/${id}/activate`, {
    method: 'PATCH',
  }),
};

// Categories API
export const categoriesAPI = {
  getAll: () => apiCall('/categories'),
  create: (category) => apiCall('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  }),
  update: (id, data) => apiCall(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/categories/${id}`, {
    method: 'DELETE',
  }),
};

// Evaluations API
export const evaluationsAPI = {
  getByCategory: (categoryId) => apiCall(`/evaluations/category/${categoryId}`),
  getByStudent: (studentId) => apiCall(`/evaluations/student/${studentId}`),
  create: (evaluation) => apiCall('/evaluations', {
    method: 'POST',
    body: JSON.stringify(evaluation),
  }),
  update: (id, data) => apiCall(`/evaluations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/evaluations/${id}`, {
    method: 'DELETE',
  }),
};
