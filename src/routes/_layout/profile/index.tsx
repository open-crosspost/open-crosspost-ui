import { createFileRoute } from '@tanstack/react-router'
import { Profile } from '../../../components/Profile'
import { getProfile } from '../../../lib/social'

export const Route = createFileRoute('/_layout/profile/')({
  loader: async ({ context }) => {
    try {
      return await getProfile(context.auth.userId)
    } catch (error) {
      // Return null to indicate profile fetch failed
      return null
    }
  },
  component: Profile,
})
