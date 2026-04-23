import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCampaign } from '../api/client'
import { ApiError } from '../api/client'

function validateEmails(raw: string): string[] | null {
  const emails = raw
    .split(/[,\n]+/)
    .map((e) => e.trim())
    .filter(Boolean)
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const invalid = emails.filter((e) => !emailRe.test(e))
  if (invalid.length > 0) return null
  return emails
}

export default function NewCampaignPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipientsRaw, setRecipientsRaw] = useState('')
  const [fieldError, setFieldError] = useState<Record<string, string>>({})

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
    if (!recipientsRaw.trim()) {
      errors.recipients = 'At least one recipient is required'
    } else {
      const parsed = validateEmails(recipientsRaw)
      if (!parsed) errors.recipients = 'One or more emails are invalid'
    }
    setFieldError(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const recipientEmails = validateEmails(recipientsRaw)!
    mutation.mutate({ name, subject, body, recipientEmails })
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

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass('name')}
            placeholder="e.g. Summer Sale Announcement"
          />
          {fieldError.name && (
            <p className="text-xs text-red-600 mt-1">{fieldError.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Subject
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className={fieldClass('body')}
            placeholder="Write your email content here…"
          />
          {fieldError.body && (
            <p className="text-xs text-red-600 mt-1">{fieldError.body}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Emails
          </label>
          <textarea
            value={recipientsRaw}
            onChange={(e) => setRecipientsRaw(e.target.value)}
            rows={3}
            className={fieldClass('recipients')}
            placeholder="alice@example.com, bob@example.com"
          />
          <p className="text-xs text-gray-400 mt-1">
            Separate multiple emails with commas or newlines
          </p>
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
