import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Clock, MapPin, Phone } from 'lucide-react'
import { phoneLink } from '../../utils/format'
import { getVenues, createVenue, updateVenue, deleteVenue } from '../../api/venues'
import type { Venue, CreateVenueRequest } from '../../types'

const EMPTY: CreateVenueRequest = {
  name: '', address: '', phone: '', description: '', imageUrl: '',
  pricePerHour: 0, openTime: '08:00:00', closeTime: '22:00:00', isActive: true,
}

function VenueModal({
  initial,
  onClose,
  onSave,
  loading,
}: {
  initial: CreateVenueRequest
  onClose: () => void
  onSave: (data: CreateVenueRequest) => void
  loading: boolean
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState(initial)

  function set(field: keyof CreateVenueRequest, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{initial.name ? t('venues.editVenue') : t('venues.addVenue')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSave(form) }}
          className="p-6 space-y-4"
        >
          {([
            ['name', t('venues.name'), 'text'],
            ['address', t('venues.address'), 'text'],
            ['phone', t('venues.phone'), 'text'],
            ['imageUrl', t('venues.imageUrl'), 'url'],
          ] as [keyof CreateVenueRequest, string, string][]).map(([field, label, type]) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                required={field !== 'imageUrl'}
                type={type}
                value={form[field] as string}
                onChange={(e) => set(field, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('venues.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('venues.price')}</label>
            <input
              required
              type="number"
              min={0}
              value={form.pricePerHour}
              onChange={(e) => set('pricePerHour', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(['openTime', 'closeTime'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field === 'openTime' ? t('venues.openTime') : t('venues.closeTime')}
                </label>
                <select
                  required
                  value={form[field].substring(0, 5)}
                  onChange={(e) => set(field, e.target.value + ':00')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {Array.from({ length: 25 }, (_, h) => {
                    const hh = String(h).padStart(2, '0')
                    const val = `${hh}:00`
                    return <option key={val} value={val}>{val}</option>
                  })}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminVenuesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; venue: Venue | null }>({ open: false, venue: null })

  const { data: venues = [], isLoading } = useQuery({ queryKey: ['venues'], queryFn: getVenues })

  const createMutation = useMutation({
    mutationFn: createVenue,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['venues'] }); setModal({ open: false, venue: null }); toast.success(t('common.save')) },
    onError: () => toast.error(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateVenueRequest> }) => updateVenue(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['venues'] }); setModal({ open: false, venue: null }); toast.success(t('common.save')) },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteVenue,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['venues'] }); toast.success(t('common.delete')) },
    onError: () => toast.error(t('common.error')),
  })

  function handleSave(data: CreateVenueRequest) {
    if (modal.venue) {
      updateMutation.mutate({ id: modal.venue.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isLoading) return <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.adminVenues')}</h1>
        <button
          onClick={() => setModal({ open: true, venue: null })}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4 text-white" />
          {t('venues.addVenue')}
        </button>
      </div>

      {!venues.length ? (
        <div className="text-center py-20 text-gray-500">{t('venues.noVenues')}</div>
      ) : (
        <div className="grid gap-4">
          {venues.map((venue) => (
            <div key={venue.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <img
                  src={venue.imageUrl || '/venue-placeholder.svg'}
                  onError={(e) => { e.currentTarget.src = '/venue-placeholder.svg' }}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 mb-1">{venue.name}</div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-500" />{venue.address}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-green-500" /><a href={phoneLink(venue.phone)} className="text-green-700 hover:underline">{venue.phone}</a></span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-orange-500" />{venue.openTime.substring(0, 5)}–{venue.closeTime.substring(0, 5)}</span>
                  <span className="flex items-center gap-1">Цена за час: {venue.pricePerHour.toLocaleString()} сум</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setModal({ open: true, venue })}
                  className="p-2 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4 text-amber-500" />
                </button>
                <button
                  onClick={() => { if (confirm(t('venues.deleteConfirm'))) deleteMutation.mutate(venue.id) }}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <VenueModal
          initial={modal.venue ? {
            name: modal.venue.name,
            address: modal.venue.address,
            phone: modal.venue.phone,
            description: modal.venue.description,
            imageUrl: modal.venue.imageUrl,
            pricePerHour: modal.venue.pricePerHour,
            openTime: modal.venue.openTime,
            closeTime: modal.venue.closeTime,
            isActive: modal.venue.isActive,
          } : EMPTY}
          onClose={() => setModal({ open: false, venue: null })}
          onSave={handleSave}
          loading={isSaving}
        />
      )}
    </div>
  )
}
