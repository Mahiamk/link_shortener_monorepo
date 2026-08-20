'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/api'
import {
  EnvelopeSimple,
  LockKey,
  CircleNotch,
  UserPlus,
  CheckCircle,
} from '@phosphor-icons/react'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      await register(email, password)
      setSuccess(
        'Registration successful! Please check your email to verify your account.'
      )
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof Error) {
        if (err.message.includes('Email already registered')) {
          setError('This email is already registered. Please use a different one.')
        } else {
          setError('Failed to register. Please try again.')
        }
      } else {
        setError('An unknown error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Create an account
        </h1>
        <p className="text-xs text-slate-500">
          Enter your email and password to register
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 text-center">
          {error}
        </div>
      )}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
          <CheckCircle weight="duotone" className="h-10 w-10 text-emerald-600 mx-auto" />
          <p className="text-xs font-semibold text-emerald-900">{success}</p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              Go to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={isLoading}
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
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus weight="duotone" className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
          </button>

          <p className="text-center text-xs text-slate-500 pt-2">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}