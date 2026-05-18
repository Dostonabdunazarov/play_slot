import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Clock, ChevronRight, Loader2 } from 'lucide-react'
import { getVenues } from '../api/venues'
import { phoneLink } from '../utils/format'

function formatTime(t: string) {
  return t.substring(0, 5)
}

export default function VenuesPage() {
  const { t } = useTranslation()
  const { data: venues, isLoading } = useQuery({ queryKey: ['venues'], queryFn: getVenues })

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t('common.loading')}
      </div>
    )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('venues.title')}</h1>
        {venues?.length ? (
          <p className="text-sm text-gray-500 mt-1">{venues.length} {t('venues.found') ?? 'площадок'}</p>
        ) : null}
      </div>

      {!venues?.length ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">⚽</div>
          <p className="text-gray-500">{t('venues.noVenues')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <Link
              key={venue.id}
              to={`/venues/${venue.id}`}
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Image with gradient overlay */}
              <div className="relative h-48 bg-gray-200 overflow-hidden">
                <img
                  src={venue.imageUrl || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80'}
                  alt={venue.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                {/* Price badge on image */}
                <div className="absolute bottom-3 left-3 bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
                  {venue.pricePerHour.toLocaleString()} {t('venues.pricePerHour')}
                </div>
              </div>

              <div className="p-4">
                <h2 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                  {venue.name}
                </h2>
                <div className="space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{venue.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <a href={phoneLink(venue.phone)} className="text-green-700 hover:underline">{venue.phone}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span>{formatTime(venue.openTime)} — {formatTime(venue.closeTime)}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end text-sm text-green-700 font-medium gap-1 group-hover:gap-2 transition-all">
                  {t('venues.viewSchedule')}
                  <ChevronRight className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
