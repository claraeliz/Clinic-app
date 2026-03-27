import api from './axios'

export const getTestResults = (patientId) =>
  api.get(`/rezultate-analize?patientId=${patientId}`)

export const getTestResult = (id) =>
  api.get(`/rezultate-analize/${id}`)

export const createTestResult = (data) =>
  api.post('/rezultate-analize', {
    patientId: data.patientId,
    category:  data.category,
    date:      data.date,
    status:    data.status   ?? 'pending',
    notes:     data.notes    ?? '',
    data:      data.resultData ?? {},
  })

export const updateTestResult = (id, data) =>
  api.put(`/rezultate-analize/${id}`, {
    category: data.category,
    date:     data.date,
    status:   data.status,
    notes:    data.notes,
    data:     data.resultData,
  })
