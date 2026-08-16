import { useCallback, useEffect, useMemo, useState } from 'react'
import { decodeJwtPayload, isJwtExpired } from '../utils/jwt'
import { setUnauthorizedHandler } from '../services/api'

function readStoredTokenOrClear() {
  const raw = localStorage.getItem('token')
  if (!raw) return null
  if (isJwtExpired(raw)) {
    localStorage.removeItem('token')
    return null
  }
  return raw
}

function useAuth() {
  const [token, setTokenState] = useState(() => readStoredTokenOrClear())

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setTokenState(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem('token')
      setTokenState(null)
    })
    return () => setUnauthorizedHandler(() => {})
  }, [])

  const setToken = useCallback((newToken) => {
    if (!newToken) return
    if (isJwtExpired(newToken)) return

    localStorage.setItem('token', newToken)
    setTokenState(newToken)
  }, [])

  const decoded = useMemo(() => decodeJwtPayload(token), [token])
  const role = decoded?.role

  return useMemo(
    () => ({
      token,
      role,
      isAuthenticated: Boolean(token),
      setToken,
      logout,
    }),
    [logout, role, setToken, token],
  )
}

export default useAuth
