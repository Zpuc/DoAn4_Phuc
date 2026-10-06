import { createContext, useContext, useState } from 'react'
import apiClient from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('autobot_user') || 'null'))

  const saveSession = ({ token, user: nextUser }) => {
    localStorage.setItem('autobot_token', token)
    localStorage.setItem('autobot_user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const login = async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials)
    saveSession(data)
    return data.user
  }

  const register = async (payload) => {
    const { data } = await apiClient.post('/auth/register', payload)
    saveSession(data)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('autobot_token')
    localStorage.removeItem('autobot_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}