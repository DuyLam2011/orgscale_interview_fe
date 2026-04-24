import { Campaign } from './types'

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Welcome Series',
    subject: 'Welcome to our platform!',
    body: 'Hi there,\n\nWelcome to our amazing platform. We are excited to have you on board!\n\nBest regards,\nThe Team',
    status: 'sent',
    recipients: [
      { id: 'r1', email: 'alice@example.com', opened: true },
      { id: 'r2', email: 'bob@example.com', opened: true },
      { id: 'r3', email: 'carol@example.com', opened: false },
      { id: 'r4', email: 'dave@example.com', opened: true },
    ],
    stats: { totalSent: 4, totalOpened: 3, sendRate: 100, openRate: 75 },
    createdAt: '2024-01-10T10:00:00Z',
    sentAt: '2024-01-11T09:00:00Z',
  },
  {
    id: '2',
    name: 'Monthly Newsletter - Feb',
    subject: 'February Updates & News',
    body: 'Dear subscriber,\n\nHere are the latest updates for February...',
    status: 'scheduled',
    recipients: [
      { id: 'r5', email: 'eve@example.com', opened: false },
      { id: 'r6', email: 'frank@example.com', opened: false },
      { id: 'r7', email: 'grace@example.com', opened: false },
    ],
    stats: { totalSent: 0, totalOpened: 0, sendRate: 0, openRate: 0 },
    createdAt: '2024-02-01T08:00:00Z',
    scheduledAt: '2024-02-15T10:00:00Z',
  },
  {
    id: '3',
    name: 'Product Launch Announcement',
    subject: 'Introducing Our New Product!',
    body: 'We are thrilled to announce the launch of our brand new product...',
    status: 'draft',
    recipients: [
      { id: 'r8', email: 'heidi@example.com', opened: false },
      { id: 'r9', email: 'ivan@example.com', opened: false },
    ],
    stats: { totalSent: 0, totalOpened: 0, sendRate: 0, openRate: 0 },
    createdAt: '2024-02-05T14:30:00Z',
  },
  {
    id: '4',
    name: 'Holiday Special Offer',
    subject: 'Exclusive Holiday Deals Inside!',
    body: 'Happy Holidays! Check out our exclusive deals just for you...',
    status: 'sent',
    recipients: [
      { id: 'r10', email: 'judy@example.com', opened: true },
      { id: 'r11', email: 'karl@example.com', opened: false },
      { id: 'r12', email: 'lisa@example.com', opened: true },
      { id: 'r13', email: 'mike@example.com', opened: true },
      { id: 'r14', email: 'nina@example.com', opened: false },
    ],
    stats: { totalSent: 5, totalOpened: 3, sendRate: 100, openRate: 60 },
    createdAt: '2023-12-20T09:00:00Z',
    sentAt: '2023-12-22T08:00:00Z',
  },
  {
    id: '5',
    name: 'Re-engagement Campaign',
    subject: 'We miss you!',
    body: "Hi, we noticed you haven't been around lately. Here's a special offer to welcome you back...",
    status: 'draft',
    recipients: [{ id: 'r15', email: 'oscar@example.com', opened: false }],
    stats: { totalSent: 0, totalOpened: 0, sendRate: 0, openRate: 0 },
    createdAt: '2024-02-08T11:00:00Z',
  },
  ...Array.from({ length: 7 }, (_, i) => {
    const status = (['draft', 'scheduled', 'sent'] as const)[i % 3]
    const isSent = status === 'sent'
    const totalSent = isSent ? 5 + i : 0
    const totalOpened = isSent ? Math.floor((5 + i) * 0.6) : 0
    return {
      id: `${6 + i}`,
      name: `Test Campaign ${6 + i}`,
      subject: `Test Subject ${6 + i}`,
      body: `Test body for campaign ${6 + i}`,
      status,
      recipients: [
        { id: `rX${i}`, email: `test${i}@example.com`, opened: isSent && i % 2 === 0 },
        { id: `rX${i}b`, email: `test${i}b@example.com`, opened: isSent },
      ],
      stats: {
        totalSent,
        totalOpened,
        sendRate: isSent ? 100 : 0,
        openRate: isSent ? Math.round((totalOpened / totalSent) * 100) : 0,
      },
      createdAt: new Date(2024, 1, i + 1).toISOString(),
      ...(isSent ? { sentAt: new Date(2024, 1, i + 2).toISOString() } : {}),
    }
  }),
]
