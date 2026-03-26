import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/index.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('scaleup_token'))
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    api.get('/auth/verify')
      .then(() => setVerified(true))
      .catch(() => { setToken(null); localStorage.removeItem('scaleup_token') })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (pin) => {
    const { data } = await api.post('/auth/login', { pin })
    localStorage.setItem('scaleup_token', data.token)
    setToken(data.token)
    setVerified(true)
  }

  const logout = () => {
    localStorage.removeItem('scaleup_token')
    setToken(null)
    setVerified(false)
  }

  return (
    <AuthContext.Provider value={{ token, verified, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
