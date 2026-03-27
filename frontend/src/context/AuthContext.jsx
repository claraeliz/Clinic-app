import { createContext, useContext, useState } from 'react'
import { login as apiLogin, logout as apiLogout, register as apiRegister, getStoredUser, getStoredTenant } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(getStoredUser)
  const [tenant, setTenant] = useState(getStoredTenant)

  async function login(email, password) {
    const { user: u, tenant: t } = await apiLogin(email, password)
    setUser(u)
    setTenant(t)
    return u
  }

  async function register(labName, name, email, password, logoUrl) {
    const { user: u, tenant: t } = await apiRegister(labName, name, email, password, logoUrl)
    setUser(u)
    setTenant(t)
    return u
  }

  function logout() {
    apiLogout()
    setUser(null)
    setTenant(null)
  }

  function updateTenant(data) {
    const updated = { ...tenant, ...data }
    setTenant(updated)
    localStorage.setItem('clinic_tenant', JSON.stringify(updated))
  }

  const role = user?.role ?? null

  return (
    <AuthContext.Provider value={{ user, tenant, role, login, logout, register, updateTenant }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
