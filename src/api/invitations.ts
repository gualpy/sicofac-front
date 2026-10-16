import { apiClient } from './client'

export type InvitationDetails = {
  email: string
  role: 'owner' | 'admin' | 'seller'
  company_name: string
  requires_password: boolean
}

export async function getInvitation(token: string): Promise<InvitationDetails> {
  const { data } = await apiClient.get<InvitationDetails>(`/auth/invitations/${token}`)
  return data
}

export async function acceptInvitation(
  token: string,
  payload: { name?: string; password?: string },
): Promise<void> {
  await apiClient.post(`/auth/invitations/${token}/accept`, payload)
}
