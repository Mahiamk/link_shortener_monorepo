'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

function VerificationComponent() {
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your email...')

  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found. Please check your link.')
      return
    }

    const verifyToken = async () => {
      try {
        // Use the environment variable for the backend URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        // --- THE FIX IS HERE ---
        // 1. Changed '/api' to '/auth' (because your router is mounted at /auth)
        // 2. Removed the trailing slash '/' before the '?' (to match standard API paths)
        const response = await fetch(
          `${apiUrl}/auth/verify-email?token=${token}`,
          {
            method: 'GET',
          },
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.detail || 'Verification failed')
        }

        setStatus('success')
        setMessage(data.message || 'Email verified successfully!')
      } catch (err) {
        setStatus('error')
        if (err instanceof Error) {
          setMessage(err.message)
        } else {
          setMessage('An unknown error occurred.')
        }
      }
    }

    verifyToken()
  }, [token])

  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white p-10 shadow-lg">
      {status === 'verifying' && (
        <>
          <Loader className="h-12 w-12 animate-spin text-gray-400" />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">
            {message}
          </h1>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle className="h-12 w-12 text-gray-500" />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">
            {message}
          </h1>
          <p className="mt-2 text-gray-600">You can now log in to your account.</p>
          <Link
            href="/login"
            className="mt-6 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
          >
            Go to Login
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="h-12 w-12 text-gray-500" />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">
            Verification Failed
          </h1>
          <p className="mt-2 text-gray-600">{message}</p>
          <Link
            href="/signup"
            className="mt-6 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
          >
            Go to Sign Up
          </Link>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={<Loader className="h-12 w-12 animate-spin" />}>
        <VerificationComponent />
      </Suspense>
    </div>
  )
}