import React, { useEffect, useState } from 'react';
import { findOrCreateProfile, getTapestryProfile } from '../../lib/tapestry';
import { useAuth } from '@/contexts/auth-context';

interface TapestryProfileProps {
  accountId: string;
}

const TapestryProfile: React.FC<TapestryProfileProps> = ({ accountId }) => {
  const { currentAccountId } = useAuth();
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTapestryData = async () => {
      if (!currentAccountId) return;

      try {
        setLoading(true);
        await findOrCreateProfile(currentAccountId, accountId);
        const profileData = await getTapestryProfile(accountId);
        if (profileData?.socialCounts) {
          setFollowers(profileData.socialCounts.followers);
          setFollowing(profileData.socialCounts.following);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTapestryData();
  }, [accountId, currentAccountId]);

  if (loading) {
    return <div>Loading Tapestry data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex space-x-4">
      <div>
        <span className="font-bold">{followers}</span> Followers
      </div>
      <div>
        <span className="font-bold">{following}</span> Following
      </div>
    </div>
  );
};

export default TapestryProfile;
