import api from '../api/axiosInstance';

export const authApi = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (data) => api.post('/users/register', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  sendOTP: (data) => api.post('/users/otp/send', data),
  loginOTP: (data) => api.post('/users/otp/login', data),
  verifyAbha: (data) => api.post('/users/verify-abha', data),
};

export const patientApi = {
  create: (data) => api.post('/patients/create', data),
  getById: (id) => api.get(`/patients/${id}`),
  search: (query) => api.get(`/patients/search?q=${query}`),
  update: (id, data) => api.put(`/patients/update/${id}`, data),
  getDashboard: () => api.get('/patients/me/dashboard'),
  getTimeline: () => api.get('/patients/me/timeline'),
};

export const visitApi = {
  create: (data) => api.post('/visits/create', data),
  getByPatient: (patientId) => api.get(`/visits/patient/${patientId}`),
  updateStatus: (id, status) => api.put(`/visits/${id}/status`, { status }),
  updateDetails: (id, data) => api.put(`/visits/${id}/details`, data),
  getQueue: () => api.get('/visits/queue'),
  getTodayStats: () => api.get('/visits/today-stats'),
};

export const reportApi = {
  upload: (formData) => api.post('/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getById: (id) => api.get(`/reports/${id}`),
  getByPatient: (patientId) => api.get(`/reports/patient/${patientId}`),
  getAll: () => api.get('/reports'),
  getOriginalUrl: (id) => `${api.defaults.baseURL}/reports/${id}/original?token=${localStorage.getItem('aayu_token')}`,
};

export const doctorApi = {
  getDashboard: () => api.get('/doctor/dashboard'),
  getStats: () => api.get('/doctor/stats'),
  getRecentActivity: () => api.get('/doctor/recent-activity'),
  updateProfile: (data) => api.put('/doctor/profile', data),
  list: () => api.get('/doctor/list'),
};

export const ownerApi = {
  getDashboard: (params) => api.get('/owner/dashboard', { params }),
  getAnalytics: (params) => api.get('/owner/analytics', { params }),
  getKPIs: (params) => api.get('/owner/kpis', { params }),
  getCharts: (params) => api.get('/owner/charts', { params }),
  getFollowUps: (params) => api.get('/owner/follow-ups', { params }),
  updateFollowUpStatus: (id, status) => api.put(`/owner/follow-ups/${id}/status`, { status }),
  getCSVExportUrl: () => `${api.defaults.baseURL}/owner/export/csv?token=${localStorage.getItem('aayu_token')}`,
  getPDFExportUrl: () => `${api.defaults.baseURL}/owner/export/pdf?token=${localStorage.getItem('aayu_token')}`,
};

export const prescriptionApi = {
  create: (data) => api.post('/prescriptions', data),
  update: (id, data) => api.put(`/prescriptions/${id}`, data),
  getById: (id) => api.get(`/prescriptions/${id}`),
  getByPatient: (patientId, params) => api.get(`/prescriptions/patient/${patientId}`, { params }),
  getByDoctor: (doctorId, params) => api.get(`/prescriptions/doctor/${doctorId}`, { params }),
  delete: (id) => api.delete(`/prescriptions/${id}`),
  getPDFUrl: (id) => `${api.defaults.baseURL}/prescriptions/${id}/pdf?token=${localStorage.getItem('aayu_token')}`,
};

export const appointmentApi = {
  create: (data) => api.post('/appointments', data),
  getAll: (params) => api.get('/appointments', { params }),
  reschedule: (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),
};

export const aiApi = {
  explainHealth: (language = "English") => api.get(`/ai/explain-health?language=${language}`),
  explainReport: (reportId, regenerate = false) => api.post('/ai/explain-report', { reportId, regenerate }),
  checkSymptoms: (symptoms, duration) => api.post('/ai/check-symptoms', { symptoms, duration }),
  answerMedicationQuery: (question) => api.post('/ai/medication-query', { question }),
  predictRisks: () => api.get('/ai/predict-risks'),
  getCoachStatus: () => api.get('/ai/coach'),
  toggleCoachTask: (taskId, completed) => api.post('/ai/coach/task/toggle', { taskId, completed }),
  converseChatbot: (message, language = "English") => api.post('/ai/chat', { message, language }),
  getChatHistory: () => api.get('/ai/chat/history'),
  clearChatHistory: () => api.delete('/ai/chat/history'),
};
