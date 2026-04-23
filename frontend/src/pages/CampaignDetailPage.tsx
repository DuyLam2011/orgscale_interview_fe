import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCampaign,
  scheduleCampaign,
  sendCampaign,
  deleteCampaign,
  ApiError,
} from '../api/client'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import { SkeletonDetail } from '../components/SkeletonLoader'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: campaign, isLoading, isError, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => getCampaign(id!),
    enabled: !!id,
  })

  const scheduleMutation = useMutation({
    mutationFn: () => scheduleCampaign(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['campaign', id], updated)
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  const sendMutation = useMutation({
    mutationFn: () => sendCampaign(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['campaign', id], updated)
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCampaign(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      navigate('/campaigns')
    },
  })

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

  function formatDate(iso?: string) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const anyMutating =
    scheduleMutation.isPending ||
    sendMutation.isPending ||
    deleteMutation.isPending

  const mutationError =
    scheduleMutation.error || sendMutation.error || deleteMutation.error

  const errorMessage =
    mutationError instanceof ApiError
      ? mutationError.message
      : mutationError
        ? 'An unexpected error occurred'
        : null

  return (
    <div>
      <button
        onClick={() => navigate('/campaigns')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        ← Back to Campaigns
      </button>

      {isLoading && <SkeletonDetail />}

      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error instanceof Error ? error.message : 'Failed to load campaign'}
        </div>
      )}

      {campaign && (
        <div className="space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {campaign.name}
                </h1>
                <p className="text-gray-500 text-sm mt-1">{campaign.subject}</p>
              </div>
              <StatusBadge status={campaign.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500 sm:grid-cols-3">
              <div>
                <span className="font-medium text-gray-700">Created</span>
                <p>{formatDate(campaign.createdAt)}</p>
              </div>
              {campaign.scheduledAt && (
                <div>
                  <span className="font-medium text-gray-700">Scheduled</span>
                  <p>{formatDate(campaign.scheduledAt)}</p>
                </div>
              )}
              {campaign.sentAt && (
                <div>
                  <span className="font-medium text-gray-700">Sent</span>
                  <p>{formatDate(campaign.sentAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Email Body
            </h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
              {campaign.body}
            </pre>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Stats
            </h2>
            <div className="grid grid-cols-2 gap-6 mb-4 text-center">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {campaign.stats.totalSent}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Sent</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {campaign.stats.totalOpened}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Opened</p>
              </div>
            </div>
            <div className="space-y-3">
              <ProgressBar
                label="Send Rate"
                value={campaign.stats.sendRate}
                colorClass="bg-blue-500"
              />
              <ProgressBar
                label="Open Rate"
                value={campaign.stats.openRate}
                colorClass="bg-green-500"
              />
            </div>
          </div>

          {/* Recipients */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Recipients ({campaign.recipients.length})
            </h2>
            <ul className="divide-y divide-gray-100">
              {campaign.recipients.map((r) => (
                <li
                  key={r.id}
                  className="py-2 flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">{r.email}</span>
                  {campaign.status === 'sent' && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.opened
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {r.opened ? 'Opened' : 'Not opened'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            {campaign.status === 'draft' && (
              <button
                onClick={() => scheduleMutation.mutate()}
                disabled={anyMutating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {scheduleMutation.isPending ? 'Scheduling…' : 'Schedule'}
              </button>
            )}
            {campaign.status === 'scheduled' && (
              <button
                onClick={() => sendMutation.mutate()}
                disabled={anyMutating}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendMutation.isPending ? 'Sending…' : 'Send Now'}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={anyMutating}
              className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
