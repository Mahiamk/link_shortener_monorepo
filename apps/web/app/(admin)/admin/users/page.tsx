'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAllUsers, User, updateUserStatus, deleteUser } from '@/lib/api'
import {
  ShieldCheck,
  User as UserIcon,
  ToggleLeft,
  ToggleRight,
  Trash,
  CircleNotch,
} from '@phosphor-icons/react'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null)

  useEffect(() => {
    setCurrentAdminEmail(localStorage.getItem('userEmail'))
  }, [])

  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('No token found. Redirecting to login...')
      setTimeout(() => router.push('/login'), 1500)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const data = await getAllUsers(token)
      setUsers(
        data
          ? data.sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          : []
      )
    } catch (err) {
      console.error(err)
      setError('Failed to fetch users.')
      if (String(err).includes('401')) {
        localStorage.removeItem('token')
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleActive = async (userToUpdate: User) => {
    const token = localStorage.getItem('token')
    if (!token) return

    if (userToUpdate.email === currentAdminEmail) {
      alert('You cannot deactivate your own account.')
      return
    }

    setUpdatingUserId(userToUpdate.id)
    try {
      const newStatus = !userToUpdate.is_active
      const updatedUser = await updateUserStatus(token, userToUpdate.id, newStatus)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updatedUser.id ? { ...u, is_active: updatedUser.is_active } : u
        )
      )
    } catch (err) {
      alert(`Failed to update status. ${err instanceof Error ? err.message : ''}`)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = async (userToDelete: User) => {
    const token = localStorage.getItem('token')
    if (!token) return

    if (userToDelete.email === currentAdminEmail) {
      alert('You cannot delete your own account.')
      return
    }

    if (
      !window.confirm(
        `Are you sure you want to permanently delete user ${userToDelete.email}?`
      )
    )
      return

    setUpdatingUserId(userToDelete.id)
    try {
      await deleteUser(token, userToDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
    } catch (err) {
      alert(`Failed to delete user. ${err instanceof Error ? err.message : ''}`)
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-400">
        <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          User Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review, activate, or remove registered accounts.
        </p>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="px-5 py-3.5">User</th>
                <th scope="col" className="px-5 py-3.5">Role</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5">Joined</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs">
                          {user.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{user.email}</div>
                          <div className="text-[11px] text-slate-400">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {user.is_superuser ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                          <ShieldCheck weight="duotone" className="h-3.5 w-3.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          Member
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {user.is_active ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {updatingUserId === user.id ? (
                        <CircleNotch weight="bold" className="h-4 w-4 animate-spin text-indigo-600 inline" />
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={user.email === currentAdminEmail}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                          >
                            {user.is_active ? (
                              <ToggleRight weight="fill" className="h-5 w-5 text-indigo-600" />
                            ) : (
                              <ToggleLeft weight="fill" className="h-5 w-5 text-slate-400" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.email === currentAdminEmail}
                            title="Delete User"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                          >
                            <Trash weight="duotone" className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}