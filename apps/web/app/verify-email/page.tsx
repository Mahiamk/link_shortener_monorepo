'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

// This is the component that does all the work
function VerificationComponent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying',
  )
  const [message, setMessage] = useState('Verifying your email...')

  // This hook reads the ?token=... part of the URL
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    // This runs once when the page loads
    if (!token) {
      setStatus('error')
      setMessage('No verification token found. Please check your link.')
      return
    }

    // This is the function that calls your backend
    const verifyToken = async () => {
      try {
        // --- IMPORTANT ---
        // Make sure this URL matches your FastAPI server and endpoint
        const response = await fetch(
          `http://localhost:8000/api/verify-email/?token=${token}`,
          {
            method: 'GET',
          },
        )

        const data = await response.json()

        if (!response.ok) {
          // Handle errors from the backend (like "Token expired")
          throw new Error(data.detail || 'Verification failed')
        }

        // --- SUCCESS! ---
        setStatus('success')
        setMessage(data.message || 'Email verified successfully!')
      } catch (err: unknown) {
        setStatus('error')
        if (err instanceof Error) {
          setMessage(err.message)
        } else {
          setMessage('An unknown error occurred.')
        }
      }
    }

    verifyToken()
  }, [token]) // Re-run if the token ever changes

  // This renders the loading/success/error message
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
          <CheckCircle className="h-12 w-12 text-green-500" />
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
          <XCircle className="h-12 w-12 text-red-500" />
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

// This is the main page component that Next.js will render
export default function VerifyEmailPage() {
  return (
    // We wrap the component in <Suspense>
    // This is required by Next.js when using useSearchParams
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={<Loader className="h-12 w-12 animate-spin" />}>
        <VerificationComponent />
      </Suspense>
    </div>
  )
}