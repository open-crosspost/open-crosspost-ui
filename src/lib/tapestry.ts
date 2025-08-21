import { SocialFi } from 'socialfi';

// const API_URL = 'https://api.usetapestry.dev/v1/'; // tapestry prod URL
const API_URL = 'https://api.dev.usetapestry.dev/v1/'; // tapestry dev URL

const API_KEY = process.env.TAPESTRY_API_KEY;

const client = new SocialFi({
  baseURL: API_URL,
});

export const findOrCreateProfile = async (walletAddress: string, username: string, customProperties: { key: string, value: string }[] = []) => {
  if (!API_KEY) {
    throw new Error("TAPESTRY_API_KEY is not set in the environment variables.");
  }
  try {
    const profile = await client.profiles.findOrCreateCreate(
      {
        apiKey: API_KEY,
      },
      {
        walletAddress,
        username,
        id: username,
        blockchain: 'SOLANA',
        execution: 'FAST_UNCONFIRMED',
      }
    );
    return profile;
  } catch (error) {
    console.error('Error creating or finding profile:', error);
    throw error;
  }
};

export const getTapestryProfile = async (profileId: string) => {
  if (!API_KEY) {
    throw new Error("TAPESTRY_API_KEY is not set in the environment variables.");
  }
  try {
    const profile = await client.profiles.profilesDetail(
      {
        apiKey: API_KEY,
        id: profileId,
      }
    );
    return profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};
