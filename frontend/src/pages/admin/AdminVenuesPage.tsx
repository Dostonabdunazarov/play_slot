import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Clock, MapPin, Pencil, Phone, Plus, Trash2, Warehouse } from 'lucide-react'
import { formatMoney, hhmm, phoneLink } from '../../utils/format'
import { getVenues, createVenue, updateVenue, deleteVenue } from '../../api/venues'
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  ListSkeleton,
  PageHeader,
  Segmented,
  Sheet,
  inputClass,
  textareaClass,
} from '../../components/ui'
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
  const [prepayMode, setPrepayMode] = useState<'none' | 'percent' | 'fixed'>(
    initial.prepaymentFixed ? 'fixed' : initial.prepaymentPercent ? 'percent' : 'none'
  )

  function set(field: keyof CreateVenueRequest, value: string | number | null) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function changePrepayMode(mode: 'none' | 'percent' | 'fixed') {
    setPrepayMode(mode)
    setForm((f) => ({
      ...f,
      prepaymentPercent: mode === 'percent' ? f.prepaymentPercent ?? 50 : null,
      prepaymentFixed: mode === 'fixed' ? f.prepaymentFixed ?? f.pricePerHour : null,
    }))
  }

  return (
    <Sheet
      title={initial.name ? t('venues.editVenue') : t('venues.addVenue')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="venue-form" size="lg" className="flex-1" loading={loading}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        id="venue-form"
        onSubmit={(e) => { e.preventDefault(); onSave(form) }}
        className="space-y-4"
      >
        {([
          ['name', t('venues.name'), 'text'],
          ['address', t('venues.address'), 'text'],
          ['phone', t('venues.phone'), 'tel'],
          ['imageUrl', t('venues.imageUrl'), 'url'],
        ] as [keyof CreateVenueRequest, string, string][]).map(([field, label, type]) => (
          <Field key={field} label={label} htmlFor={`venue-${field}`} required={field !== 'imageUrl'}>
            <input
              id={`venue-${field}`}
              required={field !== 'imageUrl'}
              type={type}
              value={form[field] as string}
              onChange={(e) => set(field, e.target.value)}
              className={inputClass}
            />
          </Field>
        ))}

        <Field label={t('venues.description')} htmlFor="venue-description">
          <textarea
            id="venue-description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            className={textareaClass}
          />
        </Field>

        <Field label={t('venues.priceInput')} htmlFor="venue-price" required>
          <input
            id="venue-price"
            required
            type="number"
            inputMode="numeric"
            min={0}
            value={form.pricePerHour}
            onChange={(e) => set('pricePerHour', parseFloat(e.target.value))}
            className={`${inputClass} tabular`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          {(['openTime', 'closeTime'] as const).map((field) => (
            <Field
              key={field}
              label={field === 'openTime' ? t('venues.openTime') : t('venues.closeTime')}
              htmlFor={`venue-${field}`}
              required
            >
              <select
                id={`venue-${field}`}
                required
                value={form[field].substring(0, 5)}
                onChange={(e) => set(field, e.target.value + ':00')}
                className={`${inputClass} tabular`}
              >
                {Array.from({ length: 25 }, (_, h) => {
                  const hh = String(h).padStart(2, '0')
                  const val = `${hh}:00`
                  return <option key={val} value={val}>{val}</option>
                })}
              </select>
            </Field>
          ))}
        </div>

        <Field label={t('venues.paymentDetailsLabel')} htmlFor="venue-payment" hint={t('venues.paymentDetailsHint')}>
          <textarea
            id="venue-payment"
            value={form.paymentDetails ?? ''}
            onChange={(e) => set('paymentDetails', e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Humo 9860 0000 0000 0000&#10;Рустамов Ж."
            className={`${textareaClass} tabular`}
          />
        </Field>

        <div>
          <div className="mb-1.5 text-sm font-medium text-ink-2">{t('venues.prepaymentLabel')}</div>
          <Segmented
            label={t('venues.prepaymentLabel')}
            value={prepayMode}
            onChange={changePrepayMode}
            options={[
              { value: 'none', label: t('venues.prepaymentNone') },
              { value: 'percent', label: t('venues.prepaymentPercent') },
              { value: 'fixed', label: t('venues.prepaymentFixed') },
            ]}
          />
          {prepayMode === 'percent' && (
            <div className="mt-3">
              <Field label={t('venues.prepaymentPercentInput')} htmlFor="venue-prepay-percent">
                <input
                  id="venue-prepay-percent"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  required
                  value={form.prepaymentPercent ?? ''}
                  onChange={(e) => set('prepaymentPercent', e.target.value ? parseInt(e.target.value) : null)}
                  className={`${inputClass} tabular`}
                />
              </Field>
            </div>
          )}
          {prepayMode === 'fixed' && (
            <div className="mt-3">
              <Field label={t('venues.prepaymentFixedInput')} htmlFor="venue-prepay-fixed">
                <input
                  id="venue-prepay-fixed"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  required
                  value={form.prepaymentFixed ?? ''}
                  onChange={(e) => set('prepaymentFixed', e.target.value ? parseFloat(e.target.value) : null)}
                  className={`${inputClass} tabular`}
                />
              </Field>
            </div>
          )}
        </div>
      </form>
    </Sheet>
  )
}

export default function AdminVenuesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; venue: Venue | null }>({ open: false, venue: null })

  const { data: venues = [], isLoading } = useQuery({ queryKey: ['venues'], queryFn: getVenues })

  const createMutation = useMutation({
    mutationFn: createVenue,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['venues'] }); setModal({ open: false, venue: null }); toast.success(t('venues.saved')) },
    onError: () => toast.error(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateVenueRequest> }) => updateVenue(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['venues'] }); setModal({ open: false, venue: null }); toast.success(t('venues.saved')) },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteVenue,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['venues'] }); toast.success(t('venues.deleted')) },
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
  const addButton = (
    <Button icon={<Plus className="size-4" />} onClick={() => setModal({ open: true, venue: null })}>
      {t('venues.addVenue')}
    </Button>
  )

  return (
    <div>
      <PageHeader
        title={t('nav.adminVenues')}
        description={venues.length ? t('venues.count', { count: venues.length }) : undefined}
        actions={venues.length ? addButton : undefined}
      />

      {isLoading ? (
        <ListSkeleton rows={3} className="h-24 rounded-2xl" />
      ) : !venues.length ? (
        <Card>
          <EmptyState
            icon={<Warehouse className="size-6" />}
            title={t('venues.noVenues')}
            text={t('venues.noVenuesAdminHint')}
            action={addButton}
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {venues.map((venue) => (
            <Card key={venue.id} className="flex items-center gap-3 p-3 sm:gap-4">
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-sunken sm:h-[72px] sm:w-28">
                <img
                  src={venue.imageUrl || '/venue-placeholder.svg'}
                  onError={(e) => { e.currentTarget.src = '/venue-placeholder.svg' }}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-bold text-ink">{venue.name}</span>
                  <span className="shrink-0 text-sm font-semibold text-ink tabular">
                    {formatMoney(venue.pricePerHour)}
                    <span className="ml-1 font-normal text-ink-3">{t('venues.pricePerHour')}</span>
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-ink-3">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{venue.address}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 tabular">
                    <Clock className="size-3.5" />
                    {hhmm(venue.openTime)}–{hhmm(venue.closeTime)}
                  </span>
                  <a href={phoneLink(venue.phone)} className="hidden items-center gap-1 tabular hover:text-brand sm:inline-flex">
                    <Phone className="size-3.5" />
                    {venue.phone}
                  </a>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                <IconButton label={t('venues.editVenue')} onClick={() => setModal({ open: true, venue })}>
                  <Pencil className="size-4.5" />
                </IconButton>
                <IconButton
                  label={t('venues.deleteVenue')}
                  tone="danger"
                  disabled={deleteMutation.isPending}
                  onClick={() => { if (confirm(t('venues.deleteConfirm'))) deleteMutation.mutate(venue.id) }}
                >
                  <Trash2 className="size-4.5" />
                </IconButton>
              </div>
            </Card>
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
            paymentDetails: modal.venue.paymentDetails ?? '',
            prepaymentPercent: modal.venue.prepaymentPercent ?? null,
            prepaymentFixed: modal.venue.prepaymentFixed ?? null,
          } : EMPTY}
          onClose={() => setModal({ open: false, venue: null })}
          onSave={handleSave}
          loading={isSaving}
        />
      )}
    </div>
  )
}
