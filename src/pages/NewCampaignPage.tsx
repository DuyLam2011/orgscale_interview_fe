import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCampaign, getRecipients, ApiError } from '../api/client'

export default function NewCampaignPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [fieldError, setFieldError] = useState<Record<string, string>>({})

  const { data: allRecipients = [], isLoading: loadingRecipients } = useQuery({
    queryKey: ['recipients'],
    queryFn: getRecipients,
  })

  const filtered = allRecipients.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()),
  )

  function toggleRecipient(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      navigate('/campaigns')
    },
  })

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Name is required'
    if (!subject.trim()) errors.subject = 'Subject is required'
    if (!body.trim()) errors.body = 'Body is required'
    if (selectedIds.size === 0) errors.recipients = 'At least one recipient is required'
    setFieldError(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate({ name, subject, body, recipientIds: Array.from(selectedIds) })
  }

  const apiError =
    mutation.isError && mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? 'An unexpected error occurred'
        : null

  function fieldClass(field: string) {
    return `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      fieldError[field] ? 'border-red-400' : 'border-gray-300'
    }`
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate('/campaigns')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Campaign</h1>
      </div>

      {apiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass('name')}
            placeholder="e.g. Summer Sale Announcement"
          />
          {fieldError.name && <p className="text-xs text-red-600 mt-1">{fieldError.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={fieldClass('subject')}
            placeholder="e.g. Don't miss our summer deals!"
          />
          {fieldError.subject && (
            <p className="text-xs text-red-600 mt-1">{fieldError.subject}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className={fieldClass('body')}
            placeholder="Write your email content here…"
          />
          {fieldError.body && <p className="text-xs text-red-600 mt-1">{fieldError.body}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipients{' '}
            {selectedIds.size > 0 && (
              <span className="text-blue-600 font-normal">({selectedIds.size} selected)</span>
            )}
          </label>

          {loadingRecipients ? (
            <p className="text-sm text-gray-400 py-2">Loading recipients…</p>
          ) : allRecipients.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              No recipients available. Run{' '}
              <code className="bg-gray-100 px-1 rounded">npm run seed</code> on the backend.
            </p>
          ) : (
            <div
              className={`border rounded-lg overflow-hidden ${fieldError.recipients ? 'border-red-400' : 'border-gray-300'}`}
            >
              <div className="p-2 border-b border-gray-200 bg-gray-50">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search recipients…"
                  className="w-full text-sm bg-transparent focus:outline-none"
                />
              </div>
              <ul className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-gray-400">No matches</li>
                ) : (
                  filtered.map((r) => (
                    <li key={r.id}>
                      <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleRecipient(r.id)}
                          className="accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          {r.name}{' '}
                          <span className="text-gray-400 text-xs">({r.email})</span>
                        </span>
                      </label>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {fieldError.recipients && (
            <p className="text-xs text-red-600 mt-1">{fieldError.recipients}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Creating…' : 'Create Campaign'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="px-5 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
