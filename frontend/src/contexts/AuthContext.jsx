import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      if (!localStorage.getItem('banhang_token')) return null
      return JSON.parse(localStorage.getItem('banhang_user'))
    }
    catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const persist = (response) => {
    localStorage.removeItem('token')
    localStorage.setItem('banhang_token', response.token)
    localStorage.setItem('banhang_user', JSON.stringify(response.user))
    setUser(response.user)
    return response.user
  }

  const login = async (payload) => persist((await api.post('/auth/login', payload)).data)
  const register = async (payload) => (await api.post('/auth/register', payload)).data
  const verifyRegistration = async (payload) => persist((await api.post('/auth/register/verify', payload)).data)
  const googleLogin = async (credential) => persist((await api.post('/auth/google', { credential })).data)

  const refreshMe = async () => {
    if (!localStorage.getItem('banhang_token')) return null
    setLoading(true)
    try {
      const current = (await api.get('/auth/me')).data
      localStorage.setItem('banhang_user', JSON.stringify(current))
      setUser(current)
      return current
    } catch {
      logout()
      return null
    } finally { setLoading(false) }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('banhang_token')
    localStorage.removeItem('banhang_user')
    setUser(null)
  }

  useEffect(() => {
    const expired = () => logout()
    window.addEventListener('banhang-auth-expired', expired)
    return () => window.removeEventListener('banhang-auth-expired', expired)
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, verifyRegistration, googleLogin, refreshMe, logout, setUser }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
