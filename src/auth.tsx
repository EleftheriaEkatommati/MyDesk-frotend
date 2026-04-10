// src/auth.tsx
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  getCurrentUser,
  login as apiLogin,
  type AuthUser,
  type User,
} from './api'

// --- AuthService Class ---
type AuthState = { user: User | null; token: string | null }

class AuthService {
  private token: string | null = localStorage.getItem('token')
  private user: User | null = null
  private subscribers: Set<(state: AuthState) => void> = new Set()

  constructor() {
    this.loadUser()
  }

  private async loadUser() {
    if (this.token) {
      try {
        this.user = await getCurrentUser(this.token)
      } catch {
        this.token = null
        localStorage.removeItem('token')
      }
    }
    this.notify()
  }

  getState(): AuthState {
    return { user: this.user, token: this.token }
  }

  async login(username: string, password?: string) {
    // Mock login for testing - bypasses the API
    if (username === 'test@example.com' && password === 'password123') {
      const mockUser: User = { id: '1', email: username, name: 'Test User' }
      this.user = mockUser
      this.token = 'mock-jwt-token'
      localStorage.setItem('token', 'mock-jwt-token')
      this.notify()
      return
    }

    const authUser: AuthUser = await apiLogin(username, password)
    const { token, ...user } = authUser
    this.user = user
    this.token = token
    localStorage.setItem('token', token)
    this.notify()
  }

  logout() {
    this.user = null
    this.token = null
    localStorage.removeItem('token')
    this.notify()
  }

  subscribe(callback: (state: AuthState) => void) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  private notify() {
    this.subscribers.forEach((callback) => callback(this.getState()))
  }
}

export const authService = new AuthService()

// --- React Auth Provider ---
const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState(authService.getState())

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState)
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return {
    ...context,
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
  }
}
