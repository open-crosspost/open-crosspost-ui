import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EditorContent } from "./drafts-store";
import { ConnectedAccount } from "@crosspost/types";
import { PostType } from "../components/post-interaction-selector";

export interface ScheduledPost {
  id: string;
  content: EditorContent[];
  selectedAccounts: ConnectedAccount[];
  postType: PostType;
  targetUrl?: string;
  scheduledDate: Date;
  status: "scheduled" | "publishing" | "published" | "failed";
  createdAt: Date;
  publishedAt?: Date;
  errorMessage?: string;
}

interface ScheduledPostsStore {
  scheduledPosts: ScheduledPost[];
  addScheduledPost: (post: Omit<ScheduledPost, "id" | "createdAt">) => void;
  removeScheduledPost: (id: string) => void;
  updateScheduledPost: (id: string, updates: Partial<ScheduledPost>) => void;
  clearScheduledPosts: () => void;
  getScheduledPost: (id: string) => ScheduledPost | undefined;
  markPostAsPublished: (id: string) => void;
  markPostAsFailed: (id: string, errorMessage?: string) => void;
  cleanupExpiredPosts: () => void;
  cleanupPublishedPosts: () => void;
}

export const useScheduledPostsStore = create<ScheduledPostsStore>()(
  persist(
    (set, get) => ({
      scheduledPosts: [],

      addScheduledPost: (post) => {
        const newPost: ScheduledPost = {
          ...post,
          id: Date.now().toString(),
          createdAt: new Date(),
        };

        set((state) => ({
          scheduledPosts: [...state.scheduledPosts, newPost],
        }));
      },

      removeScheduledPost: (id) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.filter((post) => post.id !== id),
        }));
      },

      updateScheduledPost: (id, updates) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.map((post) =>
            post.id === id ? { ...post, ...updates } : post,
          ),
        }));
      },

      clearScheduledPosts: () => {
        set({ scheduledPosts: [] });
      },

      getScheduledPost: (id) => {
        const state = get();
        return state.scheduledPosts.find((post) => post.id === id);
      },

      markPostAsPublished: (id) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.map((post) =>
            post.id === id
              ? {
                  ...post,
                  status: "published" as const,
                  publishedAt: new Date(),
                }
              : post,
          ),
        }));
      },

      markPostAsFailed: (id, errorMessage?: string) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.map((post) =>
            post.id === id
              ? { ...post, status: "failed" as const, errorMessage }
              : post,
          ),
        }));
      },

      cleanupExpiredPosts: () => {
        const now = new Date();
        set((state) => ({
          scheduledPosts: state.scheduledPosts.filter((post) => {
            // Keep posts that are scheduled for the future
            if (post.scheduledDate > now) return true;

            // Keep posts that are already published or failed (for history)
            if (post.status === "published" || post.status === "failed")
              return true;

            // Remove posts that are past their scheduled time but still marked as "scheduled"
            return false;
          }),
        }));
      },

      cleanupPublishedPosts: () => {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000); // 1 minute ago

        set((state) => ({
          scheduledPosts: state.scheduledPosts.filter((post) => {
            // Keep posts that are not published
            if (post.status !== "published") return true;

            // Keep published posts that were published less than 1 minute ago
            if (post.status === "published" && post.publishedAt) {
              return post.publishedAt > oneMinuteAgo;
            }

            return true;
          }),
        }));
      },
    }),
    {
      name: "scheduled-posts-storage", // unique name for localStorage key
      partialize: (state) => ({ scheduledPosts: state.scheduledPosts }), // only persist scheduledPosts
      onRehydrateStorage: () => (state) => {
        // Convert date strings back to Date objects when rehydrating from localStorage
        if (state?.scheduledPosts) {
          state.scheduledPosts = state.scheduledPosts.map((post) => ({
            ...post,
            scheduledDate: new Date(post.scheduledDate),
            createdAt: new Date(post.createdAt),
            publishedAt: post.publishedAt
              ? new Date(post.publishedAt)
              : undefined,
            errorMessage: post.errorMessage,
          }));
        }
      },
    },
  ),
);
