import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { approveRequest, rejectRequest } from '../api/bookingRequests'
import { apiErrorCode } from '../utils/guestRequests'
import type { StaffRequest } from '../types'

export function useRequestDecision() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const refresh = (data?: StaffRequest) => {
    if (data) queryClient.setQueryData(['staff-request', data.id], data)
    queryClient.invalidateQueries({ queryKey: ['staff-requests'] })
    queryClient.invalidateQueries({ queryKey: ['staff-request'] })
    queryClient.invalidateQueries({ queryKey: ['pending-count'] })
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
  }

  const onError = (err: unknown) => {
    const code = apiErrorCode(err)
    toast.error(
      code === 'already_decided'
        ? t('requests.alreadyDecided')
        : code === 'expired'
          ? t('requests.expiredError')
          : t('common.error')
    )
    refresh()
  }

  const approve = useMutation({
    mutationFn: (id: string) => approveRequest(id),
    onSuccess: (data) => {
      toast.success(t('requests.approved'))
      refresh(data)
    },
    onError,
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => rejectRequest(id, reason),
    onSuccess: (data) => {
      toast.success(t('requests.rejected'))
      refresh(data)
    },
    onError,
  })

  return { approve, reject }
}
