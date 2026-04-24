import {
  Campaign,
  CreateCampaignRequest,
  LoginRequest,
  LoginResponse,
  PaginatedCampaigns,
} from './types'
import { mockCampaigns } from './mockData'

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

// In-memory store for mutations during the session
let campaigns: Campaign[] = [...mockCampaigns]

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export { ApiError }

export async function login(data: LoginRequest): Promise<LoginResponse> {
  await delay(600)
  if (data.email === 'admin@example.com' && data.password === 'password') {
    return { token: 'mock-jwt-token-xyz-123' }
  }
  throw new ApiError(401, 'Invalid email or password')
}

export async function getCampaigns(
  page = 1,
  limit = 10,
): Promise<PaginatedCampaigns> {
  await delay(500)
  const sorted = [...campaigns].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const start = (page - 1) * limit
  const data = sorted.slice(start, start + limit)
  return {
    data,
    total: campaigns.length,
    page,
    limit,
    totalPages: Math.ceil(campaigns.length / limit),
  }
}

export async function getCampaign(id: string): Promise<Campaign> {
  await delay(400)
  const campaign = campaigns.find((c) => c.id === id)
  if (!campaign) throw new ApiError(404, 'Campaign not found')
  return campaign
}

export async function createCampaign(
  data: CreateCampaignRequest,
): Promise<Campaign> {
  await delay(700)
  const newCampaign: Campaign = {
    id: String(Date.now()),
    name: data.name,
    subject: data.subject,
    body: data.body,
    status: 'draft',
    recipients: data.recipientEmails.map((email, i) => ({
      id: `r-new-${i}`,
      email,
      opened: false,
    })),
    stats: { totalSent: 0, totalOpened: 0, sendRate: 0, openRate: 0 },
    createdAt: new Date().toISOString(),
  }
  campaigns = [newCampaign, ...campaigns]
  return newCampaign
}

export async function scheduleCampaign(id: string): Promise<Campaign> {
  await delay(500)
  const idx = campaigns.findIndex((c) => c.id === id)
  if (idx === -1) throw new ApiError(404, 'Campaign not found')
  if (campaigns[idx].status !== 'draft')
    throw new ApiError(400, 'Only draft campaigns can be scheduled')
  const updated: Campaign = {
    ...campaigns[idx],
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
  }
  campaigns = campaigns.map((c) => (c.id === id ? updated : c))
  return updated
}

export async function sendCampaign(id: string): Promise<Campaign> {
  await delay(800)
  const idx = campaigns.findIndex((c) => c.id === id)
  if (idx === -1) throw new ApiError(404, 'Campaign not found')
  if (campaigns[idx].status !== 'scheduled')
    throw new ApiError(400, 'Only scheduled campaigns can be sent')
  const recipients = campaigns[idx].recipients.map((r) => ({
    ...r,
    opened: Math.random() > 0.4,
  }))
  const opened = recipients.filter((r) => r.opened).length
  const updated: Campaign = {
    ...campaigns[idx],
    status: 'sent',
    recipients,
    stats: {
      totalSent: recipients.length,
      totalOpened: opened,
      sendRate: 100,
      openRate: Math.round((opened / recipients.length) * 100),
    },
    sentAt: new Date().toISOString(),
  }
  campaigns = campaigns.map((c) => (c.id === id ? updated : c))
  return updated
}

export async function deleteCampaign(id: string): Promise<void> {
  await delay(500)
  const exists = campaigns.some((c) => c.id === id)
  if (!exists) throw new ApiError(404, 'Campaign not found')
  campaigns = campaigns.filter((c) => c.id !== id)
}
