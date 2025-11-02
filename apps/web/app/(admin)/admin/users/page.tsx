'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAllUsers, User, updateUserStatus, deleteUser } from '@/lib/api'
import { ShieldCheck, User as UserIcon, ToggleLeft, ToggleRight, Trash2, Loader2 } from 'lucide-react'


export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    setCurrentAdminEmail(localStorage.getItem('userEmail'));
  }, []);

  // Fetch users function
  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError("No token found. Redirecting to login...");
      setTimeout(() => router.push('/auth/login'), 1500);
      setLoading(false)
      return
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUsers(token)
      setUsers(data ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [])
    } catch (err) {
      console.error(err)
      setError("Failed to fetch users. You may not have permission.")
      if (String(err).includes('401') || String(err).includes('credentials')) {
        localStorage.removeItem('token'); localStorage.removeItem('userEmail');
        router.push('/auth/login');
      }
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchUsers()
  }, [router]); // Re-added router dependency

  // Handler for toggling user status
  const handleToggleActive = async (userToUpdate: User) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found. Cannot update user status.");
      return;
    }

    if (userToUpdate.email === currentAdminEmail) {
      alert("You cannot deactivate your own account.");
      return;
    }

    setUpdatingUserId(userToUpdate.id);
    try {
      const newStatus = !userToUpdate.is_active;
      const updatedUser = await updateUserStatus(token, userToUpdate.id, newStatus);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === updatedUser.id ? { ...user, is_active: updatedUser.is_active } : user
        )
      );
    } catch (err) {
      console.error("Failed to update user status:", err);
      alert(`Failed to update status for ${userToUpdate.email}. ${err instanceof Error ? err.message : ''}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handler for deleting a user
  const handleDeleteUser = async (userToDelete: User) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found. Cannot delete user.");
      return;
    }

    if (userToDelete.email === currentAdminEmail) {
      alert("You cannot delete your own account.");
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user ${userToDelete.email}? This cannot be undone.`)) {
      return;
    }

    setUpdatingUserId(userToDelete.id);
    try {
      await deleteUser(token, userToDelete.id);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert(`Failed to delete ${userToDelete.email}. ${err instanceof Error ? err.message : ''}`);
    } finally {
      setUpdatingUserId(null);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500">Loading users...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-red-500">{error}</p>
      </div>
    );
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
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  {/* User Info */}
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
                  {/* Role */}
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
                  {/* Status */}
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
                  {/* Joined Date */}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  {/* Actions Cell */}
                  <td className="whitespace-nowrap px-6 py-4 text-left text-sm font-medium space-x-3">
                    {updatingUserId === user.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400 inline-flex items-center" />
                    ) : (
                      <>
                        {/* Toggle Active Button */}
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={user.email === currentAdminEmail}
                          className={`inline-flex items-center p-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.is_active
                              ? 'text-gray-400 hover:text-yellow-600'
                              : 'text-gray-400 hover:text-green-600'
                          }`}
                          title={user.is_active ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          <span className="sr-only">{user.is_active ? 'Deactivate' : 'Activate'}</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.email === currentAdminEmail}
                          className="text-gray-400 hover:text-red-600 inline-flex items-center p-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete User"
                        >
                          <Trash2 className="h-5 w-5" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </>
                    )}
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