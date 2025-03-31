import { NETWORK_ID, SupportedPlatform } from "../config";
import { getImageUrl, getProfile } from "./social";
import { PlatformAccount } from "./api-types";

// Contract addresses
const SOCIAL_CONTRACT = {
  mainnet: "social.near",
  testnet: "v1.social08.testnet",
};

export class NearSocialService {
  private wallet: any;

  constructor(wallet: any) {
    this.wallet = wallet;
  }

  /**
   * Get the current NEAR account profile
   * @returns Promise resolving to the platform account or null if not connected
   */
  async getCurrentAccountProfile(): Promise<PlatformAccount | null> {
    if (!this.wallet) return null;
    
    try {
      const accounts = await this.wallet.getAccounts();
      if (!accounts || accounts.length === 0) return null;
      
      const accountId = accounts[0].accountId;
      const profile = await getProfile(accountId);
      
      // Get profile image URL or use a fallback
      const profileImageUrl = profile?.image ? getImageUrl(profile.image) : "";
      
      return {
        platform: "Near Social" as SupportedPlatform,
        userId: accountId,
        username: profile?.name || accountId,
        profileImageUrl,
        profile: {
          userId: accountId,
          username: profile?.name || accountId,
          profileImageUrl,
          platform: "Near Social",
          lastUpdated: Date.now()
        }
      };
    } catch (error) {
      console.error("Error getting NEAR account profile:", error);
      return null;
    }
  }

  /**
   * Create a post on NEAR Social
   * @param posts Array of post content objects
   * @returns Promise resolving to the transaction result
   */
  async createPost(posts: { text: string; media?: any[] }[]): Promise<any> {
    if (!this.wallet) throw new Error("Wallet not connected");
    
    try {
      const accounts = await this.wallet.getAccounts();
      if (!accounts || accounts.length === 0) 
        throw new Error("No NEAR account connected");
      
      const account = accounts[0];
      const { accountId } = account;

      // Combine all posts into a single content
      const combinedText = posts.map(p => p.text).join("\n\n");

      const content = {
        type: "md",
        text: combinedText,
      };

      // Prepare transaction
      const actions = [{
        type: "FunctionCall",
        params: {
          methodName: "set",
          args: {
            data: {
              [accountId]: {
                post: {
                  main: JSON.stringify(content),
                },
                index: {
                  post: JSON.stringify({
                    key: "main",
                    value: {
                      type: content.type,
                    },
                  }),
                },
              },
            }
          },
          gas: "300000000000000",
          deposit: "0",
        },
      }];

      // Sign and send transaction
      return await this.wallet.signAndSendTransaction({
        receiverId: SOCIAL_CONTRACT[NETWORK_ID],
        actions,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }
}
