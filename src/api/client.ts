import { useAuthStore } from '../store/authStore'
import {
  BackendRecipient,
  Campaign,
  CampaignStats,
  CreateCampaignRequest,
  LoginRequest,
  LoginResponse,
  PaginatedCampaigns,
  Recipient,
} from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    useAuthStore.getState().logout()
    throw new ApiError(401, 'Session expired. Please log in again.')
  }

  if (res.status === 204) return undefined as T

  const body = await res.json()
  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? 'Request failed')
  }
  return body as T
}

// ---- Backend response shapes ----

interface BackendCampaign {
  id: string
  name: string
  subject: string
  body: string
  status: 'draft' | 'scheduled' | 'sent'
  scheduled_at: string | null
  created_at: string
  updated_at: string
  created_by: string
  recipient_count?: number
  recipients?: Array<{ id: string; email: string; name: string; status: string }>
}

interface BackendStats {
  total: number
  sent: number
  failed: number
  opened: number
  open_rate: number
  send_rate: number
}

// ---- Response mappers ----

function mapRecipient(r: {
  id: string
  email: string
  name: string
  status: string
}): Recipient {
  return { id: r.id, email: r.email, opened: r.status === 'opened' }
}

function mapStats(s: BackendStats): CampaignStats {
  return {
    totalSent: s.sent,
    totalOpened: s.opened,
    sendRate: Math.round(s.send_rate * 100),
    openRate: Math.round(s.open_rate * 100),
  }
}

const EMPTY_STATS: CampaignStats = { totalSent: 0, totalOpened: 0, sendRate: 0, openRate: 0 }

function mapCampaign(c: BackendCampaign, stats?: BackendStats): Campaign {
  return {
    id: c.id,
    name: c.name,
    subject: c.subject,
    body: c.body,
    status: c.status,
    createdAt: c.created_at,
    scheduledAt: c.scheduled_at ?? undefined,
    sentAt: c.status === 'sent' ? c.updated_at : undefined,
    recipients: c.recipients ? c.recipients.map(mapRecipient) : [],
    stats: stats ? mapStats(stats) : EMPTY_STATS,
  }
}

// ---- API functions ----

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await request<{ user: unknown; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return { token: res.token }
}

export async function getCampaigns(page = 1, limit = 10): Promise<PaginatedCampaigns> {
  const res = await request<{
    data: BackendCampaign[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>(`/campaigns?page=${page}&limit=${limit}`)
  return {
    data: res.data.map((c) => mapCampaign(c)),
    total: res.total,
    page: res.page,
    limit: res.limit,
    totalPages: res.totalPages,
  }
}

export async function getCampaign(id: string): Promise<Campaign> {
  const [campaign, stats] = await Promise.all([
    request<BackendCampaign>(`/campaigns/${id}`),
    request<BackendStats>(`/campaigns/${id}/stats`),
  ])
  return mapCampaign(campaign, stats)
}

export async function createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
  const campaign = await request<BackendCampaign>('/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      subject: data.subject,
      body: data.body,
      recipient_ids: data.recipientIds,
    }),
  })
  return mapCampaign(campaign)
}

export async function scheduleCampaign(id: string, scheduledAt: string): Promise<Campaign> {
  const campaign = await request<BackendCampaign>(`/campaigns/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  })
  return mapCampaign(campaign)
}

export async function sendCampaign(id: string): Promise<Campaign> {
  const campaign = await request<BackendCampaign>(`/campaigns/${id}/send`, {
    method: 'POST',
  })
  const stats = await request<BackendStats>(`/campaigns/${id}/stats`)
  return mapCampaign(campaign, stats)
}

export async function deleteCampaign(id: string): Promise<void> {
  await request<void>(`/campaigns/${id}`, { method: 'DELETE' })
}

export async function getRecipients(): Promise<BackendRecipient[]> {
  return request<BackendRecipient[]>('/recipients')
}
