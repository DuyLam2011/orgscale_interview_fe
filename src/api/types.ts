export type CampaignStatus = 'draft' | 'scheduled' | 'sent'

export interface Recipient {
  id: string
  email: string
  opened: boolean
}

export interface BackendRecipient {
  id: string
  email: string
  name: string
}

export interface CampaignStats {
  totalSent: number
  totalOpened: number
  sendRate: number
  openRate: number
}

export interface Campaign {
  id: string
  name: string
  subject: string
  body: string
  status: CampaignStatus
  recipients: Recipient[]
  stats: CampaignStats
  createdAt: string
  scheduledAt?: string
  sentAt?: string
}

export interface PaginatedCampaigns {
  data: Campaign[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface CreateCampaignRequest {
  name: string
  subject: string
  body: string
  recipientIds: string[]
}
