'use client'

import { useEffect, useState } from 'react'
import { getAllUsers, User } from '@/lib/api' // Adjust path if needed
import { ShieldCheck, User as UserIcon } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError("No token found. Please log in.")
        setLoading(false)
        return
      }

      try {
        const data = await getAllUsers(token)
        setUsers(data ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [])
      } catch (err) {
        console.error(err)
        setError("Failed to fetch users. You may not have permission.")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500">Loading users...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900">
        User Management
      </h2>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Joined On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {user.is_superuser ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                        <ShieldCheck className="h-4 w-4" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        User
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {user.is_active ? (
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

