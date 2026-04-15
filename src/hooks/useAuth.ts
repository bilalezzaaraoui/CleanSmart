import { useState, useCallback } from 'react'

const SESSION_KEY = 'cs_auth'
const CREDENTIALS = { username: 'admin', password: 'parnassa' }

/**
 * Manages a simple session stored in localStorage.
 * The app content must never render until isAuthenticated === true.
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => localStorage.getItem(SESSION_KEY) === '1'
  )

  const login = useCallback((username: string, password: string): boolean => {
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      localStorage.setItem(SESSION_KEY, '1')
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, login, logout }
}
