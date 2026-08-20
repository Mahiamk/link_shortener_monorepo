'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, loginOrRegisterWithGoogle } from '@/lib/api'
import {
  EnvelopeSimple,
  LockKey,
  CircleNotch,
  GoogleLogo,
  SignIn,
} from '@phosphor-icons/react'
import {
  auth,
  GoogleAuthProvider,
  signInWithPopup,
} from '@/lib/firebase'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login(email, password)

      if (!result || !result.access_token) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      localStorage.setItem('token', result.access_token)
      localStorage.setItem('userEmail', email)

      router.push('/dashboard')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred during login.')
      }
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')

    const provider = new GoogleAuthProvider()

    try {
      const result = await signInWithPopup(auth, provider)
      const firebaseToken = await result.user.getIdToken()
      const loginResult = await loginOrRegisterWithGoogle(firebaseToken)

      if (!loginResult || !loginResult.access_token) {
        setError('Failed to log in with Google.')
        setIsGoogleLoading(false)
        return
      }

      localStorage.setItem('token', loginResult.access_token)
      localStorage.setItem('userEmail', result.user.email || '')

      router.push('/dashboard')
    } catch (err: unknown) {
      if (err instanceof Error) {
        if ('code' in err && err.code === 'auth/popup-closed-by-user') {
          setError('Sign-in cancelled.')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred with Google sign-in.')
      }
      console.error(err)
      setIsGoogleLoading(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p className="text-xs text-slate-500">
          Enter your email and password to log in
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 text-center">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email address
          </label>
          <div className="relative">
            <EnvelopeSimple
              weight="duotone"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <LockKey
              weight="duotone"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
          ) : (
            <SignIn weight="duotone" className="h-4 w-4" />
          )}
          <span>{isLoading ? 'Logging in...' : 'Sign in to account'}</span>
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-2 text-slate-400">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {isGoogleLoading ? (
            <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleLogo weight="bold" className="h-4 w-4 text-slate-700" />
          )}
          <span>{isGoogleLoading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>
      </div>

      <p className="text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-indigo-600 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}
