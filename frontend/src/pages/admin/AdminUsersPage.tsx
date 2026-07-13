import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Plus, Trash2, X, User, Eye, EyeOff } from 'lucide-react'
import { phoneLink } from '../../utils/format'
import { getUsers, createUser, deleteUser } from '../../api/users'
import type { CreateUserRequest, Role } from '../../types'

const EMPTY: CreateUserRequest = { fullName: '', phone: '', email: '', password: '', role: 'User' }

function CreateUserModal({
  onClose,
  onSave,
  loading,
}: {
  onClose: () => void
  onSave: (data: CreateUserRequest) => void
  loading: boolean
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<CreateUserRequest>(EMPTY)
  const [showPassword, setShowPassword] = useState(false)

  function set<K extends keyof CreateUserRequest>(field: K, value: CreateUserRequest[K]) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold">{t('users.addUser')}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="p-5 space-y-4" autoComplete="off">
          {([
            ['fullName', t('users.fullName'), 'text', 'off'],
            ['email', t('users.email'), 'email', 'off'],
            ['phone', t('users.phone'), 'text', 'off'],
          ] as [keyof CreateUserRequest, string, string, string][]).map(([field, label, type, ac]) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                required
                type={type}
                name={field}
                autoComplete={ac}
                value={form[field] as string}
                onChange={(e) => set(field, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.password')}</label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? t('users.hidePassword') : t('users.showPassword')}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.role')}</label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value as Role)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="User">{t('users.roles.user')}</option>
              <option value="Admin">{t('users.roles.admin')}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors text-sm"
            >
              {loading ? t('common.loading') : t('common.create')}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setModalOpen(false); toast.success(t('common.create')) },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success(t('common.delete')) },
    onError: () => toast.error(t('common.error')),
  })

  if (isLoading) return <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.adminUsers')}</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4 text-white" />
          {t('users.addUser')}
        </button>
      </div>

      {!users.length ? (
        <div className="text-center py-20 text-gray-500">{t('users.noUsers')}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">{t('users.fullName')}</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">{t('users.email')}</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">{t('users.phone')}</th>
                <th className="text-left px-5 py-3">{t('users.role')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-green-700" />
                      </div>
                      <span className="font-medium text-gray-900">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600 hidden sm:table-cell">{user.email}</td>
                  <td className="px-5 py-3 hidden md:table-cell"><a href={phoneLink(user.phone)} className="text-green-700 hover:underline">{user.phone}</a></td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {t(`users.roles.${user.role.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => { if (confirm(t('users.deleteConfirm'))) deleteMutation.mutate(user.id) }}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <CreateUserModal
          onClose={() => setModalOpen(false)}
          onSave={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
      )}
    </div>
  )
}
