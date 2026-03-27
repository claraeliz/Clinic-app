import api from './axios'

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password })
  const { token, user, tenant } = res.data
  localStorage.setItem('jwt_token', token)
  localStorage.setItem('clinic_user', JSON.stringify(user))
  localStorage.setItem('clinic_tenant', JSON.stringify(tenant))
  return { user, tenant }
}

export async function register(labName, name, email, password, logoUrl) {
  const res = await api.post('/auth/register', { labName, name, email, password, logoUrl })
  const { token, user, tenant } = res.data
  localStorage.setItem('jwt_token', token)
  localStorage.setItem('clinic_user', JSON.stringify(user))
  localStorage.setItem('clinic_tenant', JSON.stringify(tenant))
  return { user, tenant }
}

export function logout() {
  localStorage.removeItem('jwt_token')
  localStorage.removeItem('clinic_user')
  localStorage.removeItem('clinic_tenant')
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('clinic_user')) } catch { return null }
}

export function getStoredTenant() {
  try { return JSON.parse(localStorage.getItem('clinic_tenant')) } catch { return null }
}
