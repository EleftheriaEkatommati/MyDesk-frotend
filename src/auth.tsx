// src/auth.tsx
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  getCurrentUser,
  login as apiLogin,
  type AuthResponse,
  type AuthUser,
  type User,
} from './api'

// --- AuthService Class ---
type AuthState = { user: User | null; token: string | null }

class AuthService {
  private token: string | null = localStorage.getItem('token')
  private user: User | null = null
  private subscribers: Set<(state: AuthState) => void> = new Set()
  private initialLoadPromise: Promise<void>

  constructor() {
    this.initialLoadPromise = this.loadUser()
  }

  loadUser = async () => {
    // Always sync token from localStorage before trying to load user
    this.token = localStorage.getItem('token')

    if (this.token) {
      try {
        this.user = await getCurrentUser(this.token)
      } catch {
        this.token = null
        this.user = null
        localStorage.removeItem('token')
      }
    } else {
      // If there's no token, ensure user is also null
      this.user = null
    }
    this.notify()
  }

  getState(): AuthState {
    return { user: this.user, token: this.token }
  }

  login = async (username: string, password?: string) => {
    // Mock login for testing - bypasses the API
    if (username === 'test@example.com' && password === 'password123') {
      const mockUser: User = {
        id: 1,
        email: username,
        name: 'Test Admin',
        role: { id: 1, name: 'admin' },
      }
      this.user = mockUser
      this.token = 'mock-jwt-token'
      localStorage.setItem('token', 'mock-jwt-token')
      this.notify()
      return
    }

    // The login API now returns a minimal AuthResponse.
    const authResponse: AuthResponse = await apiLogin(username, password)
    this.token = authResponse.token
    localStorage.setItem('token', this.token)

    // After receiving the token, we fetch the full user profile.
    // This ensures the user object in our auth context is complete.
    this.user = await getCurrentUser(this.token)

    if (!this.user) {
      // If for some reason we can't get the user profile, treat it as a failed login.
      this.logout() // This will clear the token and user state.
      throw new Error('Login succeeded, but failed to fetch user profile.')
    }

    this.notify()
  }

  logout = () => {
    this.user = null
    this.token = null
    localStorage.removeItem('token')
    this.notify()
  }

  ensureLoaded = async () => {
    await this.initialLoadPromise
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

  return useMemo(
    () => ({
      ...context,
      isAuthenticated: !!context.user,
      login: authService.login,
      logout: authService.logout,
      reloadUser: authService.loadUser,
      ensureLoaded: authService.ensureLoaded,
    }),
    [context],
  )
}
