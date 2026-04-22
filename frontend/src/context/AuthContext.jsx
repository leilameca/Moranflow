import { useCallback, useEffect, useMemo, useState } from 'react'

import { AuthContext } from './auth-context.js'
import { moranApi } from '../services/moranApi.js'

const STORAGE_KEY = 'moran-studio-auth'

const readStoredAuth = () => {
  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {
      token: null,
      user: null,
    }
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {
      token: null,
      user: null,
    }
  }
}

export const AuthProvider = ({ children }) => {
  const initial = readStoredAuth()
  const [token, setToken] = useState(initial.token)
  const [user, setUser] = useState(initial.user)
  const [loading, setLoading] = useState(Boolean(initial.token))

  const persist = (nextToken, nextUser) => {
    if (!nextToken || !nextUser) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: nextToken,
        user: nextUser,
      })
    )
  }

  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await moranApi.getProfile()

        if (!cancelled) {
          setUser(response.user)
          persist(token, response.user)
        }
      } catch {
        if (!cancelled) {
          setToken(null)
          setUser(null)
          persist(null, null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    hydrate()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    const handleExpiredSession = () => {
      setToken(null)
      setUser(null)
      persist(null, null)
      setLoading(false)
    }

    window.addEventListener('moran-auth-expired', handleExpiredSession)

    return () => {
      window.removeEventListener('moran-auth-expired', handleExpiredSession)
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const response = await moranApi.login(credentials)
    setToken(response.token)
    setUser(response.user)
    persist(response.token, response.user)
    return response
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    persist(null, null)
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, loading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
