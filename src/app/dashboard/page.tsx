'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../components/DashboardLayout'

export default function DashboardPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication status
    const auth = localStorage.getItem('auth')
    if (auth) {
      try {
        const authData = JSON.parse(auth)
        if (authData.authenticated && authData.username === 'htsscrm') {
          setAuthenticated(true)
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <DashboardLayout />
}