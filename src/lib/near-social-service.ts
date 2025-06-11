import { Social } from "@builddao/near-social-js";
import { getErrorMessage, isPlatformError } from "@crosspost/sdk";
import {
  ConnectedAccount,
  Platform,
  PlatformName,
  PostContent,
} from "@crosspost/types";
import { NETWORK_ID } from "../config";
import { near } from "./near";
import { getImageUrl, getProfile } from "./utils/near-social-node";

export const SOCIAL_CONTRACT = {
  mainnet: "social.near",
  testnet: "v1.social08.testnet",
};

/**
 * Upload a file or data URL to IPFS via NEAR Social
 * @param fileOrData The file to upload or a data URL/base64 string
 * @returns Promise resolving to the IPFS CID
 */
export async function uploadFileToIPFS(
  fileOrData: File | string,
): Promise<string> {
  try {
    const formData = new FormData();

    if (typeof fileOrData === "string") {
      // Handle data URL or base64 string
      // Convert data URL to blob
      let blob: Blob;

      if (fileOrData.startsWith("data:")) {
        // It's a data URL
        const response = await fetch(fileOrData);
        blob = await response.blob();
      } else {
        // Assume it's base64 data
        const byteString = atob(fileOrData.split(",")[1] || fileOrData);
        const mimeType =
          fileOrData.split(",")[0]?.split(":")[1]?.split(";")[0] ||
          "image/jpeg";
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        blob = new Blob([ab], { type: mimeType });
      }

      // Create a File from the Blob
      const file = new File([blob], "image.jpg", { type: blob.type });
      formData.append("file", file);
    } else {
      // It's already a File object
      formData.append("file", fileOrData);
    }

    const response = await fetch("https://ipfs.near.social/add", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.cid;
  } catch (error) {
    console.error("Error uploading file to IPFS:", getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Transforms post content for NEAR Social posting.
 * Combines text from multiple posts into a single string.
 * @param posts - Array of post content objects.
 * @returns A single string combining the text of all posts.
 */
export function transformNearSocialPost(posts: PostContent[]): string {
  const combinedText = posts.map((p) => p.text).join("\n\n");
  return combinedText;
}

export class NearSocialService {
  constructor() {}

  /**
   * Get the current NEAR account profile
   * @returns Promise resolving to the platform account or null if not connected
   */
  async getCurrentAccountProfile(): Promise<ConnectedAccount | null> {
    if (near.authStatus() !== "SignedIn") return null;
    const accountId = near.accountId()!;

    try {
      const profile = await getProfile(accountId);

      // Get profile image URL or use a fallback
      const profileImageUrl = profile?.image ? getImageUrl(profile.image) : "";

      return {
        platform: "Near Social" as PlatformName,
        userId: accountId,
        connectedAt: "",
        profile: {
          userId: accountId,
          username: profile?.name || accountId,
          profileImageUrl,
          platform: "Near Social" as Platform,
          lastUpdated: Date.now(),
        },
      };
    } catch (error) {
      console.error(
        "Error getting NEAR account profile:",
        getErrorMessage(error),
      );
      return null;
    }
  }

  /**
   * Create a post on NEAR Social
   * @param posts Array of post content objects
   * @returns Promise resolving to the transaction object
   */
  async createPost(posts: PostContent[]): Promise<void> {
    if (near.authStatus() !== "SignedIn")
      throw new Error("Wallet not connected");
    const accountId = near.accountId()!;
    const publicKey = near.publicKey()!;

    try {
      // Combine all posts into a single content, joining with newlines
      const combinedText = posts.map((p) => p.text).join("\n\n");

      const content = {
        type: "md",
        text: combinedText,
      };

      const nearSocialClient = new Social({
        contractId: SOCIAL_CONTRACT[NETWORK_ID],
        network: NETWORK_ID,
      });

      const transaction = await nearSocialClient.set({
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
        },
        account: {
          // this is used to validate that the user has permission to post
          publicKey: publicKey,
          accountID: accountId,
        },
      });

      const transformedActions = transaction.actions.map((action) => {
        if (!action.functionCall) {
          throw new Error(`Unsupported action type: ${action.enum}`);
        }

        const functionCall = action.functionCall;
        return near.actions.functionCall({
          methodName: functionCall.methodName,
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
            },
          },
          gas: functionCall.gas.toString(),
          deposit: functionCall.deposit.toString(), // we still calculate the deposit from near-social-js
        });
      });

      await near.sendTx({
        receiverId: SOCIAL_CONTRACT[NETWORK_ID],
        actions: transformedActions,
      });
    } catch (error) {
      console.error("Error creating post:", getErrorMessage(error));

      if (isPlatformError(error)) {
        throw error;
      }

      throw new Error(getErrorMessage(error));
    }
  }
}
