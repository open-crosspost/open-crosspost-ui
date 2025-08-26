import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PlatformName } from "@crosspost/types";
import { EditorContent } from "./drafts-store";

export interface ScheduledPost {
  id: string;
  createdAt: string;
  scheduledFor: string;
  posts: EditorContent[];
  platforms: PlatformName[];
  status: "pending" | "executing" | "completed" | "failed";
  executedAt?: string;
  error?: string;
  authToken?: string;
}

interface ScheduledPostsState {
  scheduledPosts: ScheduledPost[];
  saveScheduledPost: (posts: EditorContent[], platforms: PlatformName[], scheduledFor: Date) => string;
  updateScheduledPost: (id: string, updates: Partial<ScheduledPost>) => void;
  deleteScheduledPost: (id: string) => void;
  getUpcomingPosts: () => ScheduledPost[];
  getPendingPosts: () => ScheduledPost[];
  markAsExecuting: (id: string) => void;
  markAsCompleted: (id: string) => void;
  markAsFailed: (id: string, error: string) => void;
}

export const useScheduledPostsStore = create<ScheduledPostsState>()(
  persist(
    (set, get) => ({
      scheduledPosts: [],

      saveScheduledPost: (posts, platforms, scheduledFor) => {
        const newScheduledPost: ScheduledPost = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          scheduledFor: scheduledFor.toISOString(),
          posts,
          platforms,
          status: "pending",
        };

        set((state) => ({
          scheduledPosts: [newScheduledPost, ...state.scheduledPosts],
        }));

        return newScheduledPost.id;
      },

      updateScheduledPost: (id, updates) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.map((post) =>
            post.id === id ? { ...post, ...updates } : post
          ),
        }));
      },

      deleteScheduledPost: (id) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.filter((post) => post.id !== id),
        }));
      },

      getUpcomingPosts: () => {
        const now = new Date();
        return get().scheduledPosts
          .filter((post) => new Date(post.scheduledFor) > now && post.status === "pending")
          .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
      },

      getPendingPosts: () => {
        const now = new Date();
        return get().scheduledPosts
          .filter((post) => new Date(post.scheduledFor) <= now && post.status === "pending");
      },

      markAsExecuting: (id) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.map((post) =>
            post.id === id ? { ...post, status: "executing" as const } : post
          ),
        }));
      },

      markAsCompleted: (id) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.map((post) =>
            post.id === id 
              ? { 
                  ...post, 
                  status: "completed" as const, 
                  executedAt: new Date().toISOString() 
                } 
              : post
          ),
        }));
      },

      markAsFailed: (id, error) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.map((post) =>
            post.id === id 
              ? { 
                  ...post, 
                  status: "failed" as const, 
                  error,
                  executedAt: new Date().toISOString() 
                } 
              : post
          ),
        }));
      },
    }),
    {
      name: "crosspost-scheduled-posts",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
