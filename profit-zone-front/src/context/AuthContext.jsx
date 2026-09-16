import { useMemo, useState } from 'react'
import { AuthContext } from './authContextValue.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const value = useMemo(
    () => ({
      user,
      login: (userData, token) => {
        localStorage.setItem('token', token)
        setUser(userData)
      },
      logout: () => {
        localStorage.removeItem('token')
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
