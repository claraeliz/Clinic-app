import api from './axios'

export const getPatients = () =>
  api.get('/pacienti')

export const getPatient = (id) =>
  api.get(`/pacienti/${id}`)

export const createPatient = (data) =>
  api.post('/pacienti', data)

export const updatePatient = (id, data) =>
  api.put(`/pacienti/${id}`, data)

export const deletePatient = (id) =>
  api.delete(`/pacienti/${id}`)

export const sendReportEmail = (patientId) =>
  api.post(`/email/send-report/${patientId}`, {}, { timeout: 15000 })
