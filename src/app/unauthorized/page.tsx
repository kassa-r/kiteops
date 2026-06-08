'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()

  useEffect(() => {
    // Optional: Redirect to login or home after a few seconds
    // For now, let's just display the message and provide a link
    // const timer = setTimeout(() => {
    //   router.push('/login')
    // }, 5000) // Redirect after 5 seconds

    // return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Unauthorized Access
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          You do not have permission to access this page.
        </p>
        <div className="mt-5">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Go to Login Page
          </Link>
          <span className="mx-2 text-gray-400">or</span>
          <Link href="/dashboard" className="font-medium text-indigo-600 hover:text-indigo-500">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}