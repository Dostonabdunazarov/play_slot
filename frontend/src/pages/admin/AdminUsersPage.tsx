import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Eye, EyeOff, KeyRound, Plus, Trash2, Users } from 'lucide-react'
import { phoneLink } from '../../utils/format'
import { getUsers, createUser, deleteUser, changePassword } from '../../api/users'
import { useAuthStore } from '../../store/authStore'
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  ListSkeleton,
  PageHeader,
  Sheet,
  Tag,
  inputClass,
} from '../../components/ui'
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
    <Sheet
      title={t('users.addUser')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="user-form" size="lg" className="flex-1" loading={loading}>
            {t('common.create')}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4" autoComplete="off">
        {([
          ['fullName', t('users.fullName'), 'text', 'off'],
          ['email', t('users.email'), 'email', 'off'],
          ['phone', t('users.phone'), 'tel', 'off'],
        ] as [keyof CreateUserRequest, string, string, string][]).map(([field, label, type, ac]) => (
          <Field key={field} label={label} htmlFor={`user-${field}`} required>
            <input
              id={`user-${field}`}
              required
              type={type}
              name={field}
              autoComplete={ac}
              value={form[field] as string}
              onChange={(e) => set(field, e.target.value)}
              className={inputClass}
            />
          </Field>
        ))}

        <Field label={t('users.password')} htmlFor="user-password" hint={t('users.passwordHint')} required>
          <div className="relative">
            <input
              id="user-password"
              required
              minLength={10}
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-3 transition-colors hover:text-ink"
              aria-label={showPassword ? t('users.hidePassword') : t('users.showPassword')}
            >
              {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
            </button>
          </div>
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink-2">{t('users.role')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['User', 'Admin'] as Role[]).map((r) => {
              const on = form.role === r
              return (
                <label
                  key={r}
                  className={`flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                    on ? 'border-brand bg-brand-soft text-ink' : 'border-line-strong text-ink-2 hover:bg-sunken'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={on}
                    onChange={() => set('role', r)}
                    className="sr-only"
                  />
                  {t(`users.roles.${r.toLowerCase()}`)}
                </label>
              )
            })}
          </div>
        </fieldset>
      </form>
    </Sheet>
  )
}

function ChangePasswordModal({
  onClose,
  onSave,
  loading,
}: {
  onClose: () => void
  onSave: (data: { currentPassword: string; newPassword: string }) => void
  loading: boolean
}) {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  return (
    <Sheet
      title={t('users.changePassword')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="password-form" size="lg" className="flex-1" loading={loading}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        id="password-form"
        onSubmit={(e) => { e.preventDefault(); onSave({ currentPassword, newPassword }) }}
        className="space-y-4"
      >
        <Field label={t('users.currentPassword')} htmlFor="current-password" required>
          <input
            id="current-password"
            required
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('users.newPassword')} htmlFor="new-password" hint={t('users.passwordHint')} required>
          <input
            id="new-password"
            required
            minLength={10}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
      </form>
    </Sheet>
  )
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [modalOpen, setModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setModalOpen(false); toast.success(t('users.created')) },
    onError: () => toast.error(t('common.error')),
  })

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => { setPasswordModalOpen(false); toast.success(t('users.passwordChanged')) },
    onError: () => toast.error(t('users.passwordError')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success(t('users.deleted')) },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <div>
      <PageHeader
        title={t('nav.adminUsers')}
        description={users.length ? t('users.count', { count: users.length }) : undefined}
        actions={
          <>
            <Button variant="secondary" icon={<KeyRound className="size-4" />} onClick={() => setPasswordModalOpen(true)}>
              {t('users.changePassword')}
            </Button>
            <Button icon={<Plus className="size-4" />} onClick={() => setModalOpen(true)}>
              {t('users.addUser')}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <ListSkeleton rows={4} className="h-16 rounded-2xl" />
      ) : !users.length ? (
        <Card>
          <EmptyState icon={<Users className="size-6" />} title={t('users.noUsers')} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {users.map((user) => (
              <li key={user.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sunken text-sm font-bold text-ink-2">
                  {user.fullName.trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[1.2fr_1.4fr_1fr] sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-ink">{user.fullName}</span>
                    {user.id === currentUserId && <span className="text-xs text-ink-3">({t('users.you')})</span>}
                  </div>
                  <div className="truncate text-sm text-ink-3">{user.email}</div>
                  <a href={phoneLink(user.phone)} className="block truncate text-sm text-ink-2 tabular hover:text-brand">
                    {user.phone}
                  </a>
                </div>
                <span className="flex shrink-0 sm:w-32 sm:justify-end"><Tag>{t(`users.roles.${user.role.toLowerCase()}`)}</Tag></span>
                <IconButton
                  label={t('common.delete')}
                  tone="danger"
                  disabled={deleteMutation.isPending || user.id === currentUserId}
                  onClick={() => { if (confirm(t('users.deleteConfirm'))) deleteMutation.mutate(user.id) }}
                >
                  <Trash2 className="size-4.5" />
                </IconButton>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {passwordModalOpen && (
        <ChangePasswordModal
          onClose={() => setPasswordModalOpen(false)}
          onSave={(data) => passwordMutation.mutate(data)}
          loading={passwordMutation.isPending}
        />
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
