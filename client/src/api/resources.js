import api from './index.js'

// Sessions
export const sessionsApi = {
  list:   (params) => api.get('/sessions', { params }),
  today:  ()       => api.get('/sessions/today'),
  get:    (id)     => api.get(`/sessions/${id}`),
  create: (body)   => api.post('/sessions', body),
  update: (id, b)  => api.put(`/sessions/${id}`, b),
  delete: (id)     => api.delete(`/sessions/${id}`)
}

// Pieces
export const piecesApi = {
  list:     (params) => api.get('/pieces', { params }),
  get:      (id)     => api.get(`/pieces/${id}`),
  sessions: (id)     => api.get(`/pieces/${id}/sessions`),
  create:   (body)   => api.post('/pieces', body),
  update:   (id, b)  => api.put(`/pieces/${id}`, b),
  delete:   (id)     => api.delete(`/pieces/${id}`)
}

// Goals
export const goalsApi = {
  list:     (params) => api.get('/goals', { params }),
  get:      (id)     => api.get(`/goals/${id}`),
  create:   (body)   => api.post('/goals', body),
  update:   (id, b)  => api.put(`/goals/${id}`, b),
  complete: (id)     => api.post(`/goals/${id}/complete`),
  delete:   (id)     => api.delete(`/goals/${id}`)
}

// Stats
export const statsApi = {
  summary:  ()       => api.get('/stats/summary'),
  streak:   ()       => api.get('/stats/streak'),
  heatmap:  (year)   => api.get('/stats/heatmap', { params: { year } }),
  byType:   ()       => api.get('/stats/by-type'),
  byPiece:  ()       => api.get('/stats/by-piece'),
  progress: (pid)    => api.get('/stats/progress', { params: { piece_id: pid } }),
  weekly:   ()       => api.get('/stats/weekly')
}

// Uploads
export const uploadsApi = {
  list:   (params) => api.get('/uploads', { params }),
  upload: (formData) => api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id)     => api.delete(`/uploads/${id}`)
}
