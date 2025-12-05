import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MediaContent, PostContent } from "@crosspost/types";

export interface EditorMedia extends MediaContent {
  // Additional fields for UI handling
  id?: string | null;
  preview?: string | null;
}

export interface EditorContent extends PostContent {
  media: EditorMedia[];
}

export interface Draft {
  id: string;
  createdAt: string;
  updatedAt: string;
  posts: EditorContent[];
}

interface DraftsState {
  drafts: Draft[];
  isModalOpen: boolean;
  autosave: { posts: EditorContent[] } | null;
  updateDraft: (id: string, posts: EditorContent[]) => void;
  deleteDraft: (id: string) => void;
  setModalOpen: (isOpen: boolean) => void;
  saveAutoSave: (posts: EditorContent[]) => void;
  clearAutoSave: () => void;
  saveDraft: (posts: EditorContent[]) => string;
}

export const useDraftsStore = create<DraftsState>()(
  persist(
    (set) => ({
      drafts: [],
      isModalOpen: false,
      autosave: null,

      saveDraft: (posts) => {
        const newDraft: Draft = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          posts,
        };

        set((state) => ({
          drafts: [newDraft, ...state.drafts],
        }));

        return newDraft.id;
      },

      updateDraft: (id, posts) => {
        set((state) => ({
          drafts: state.drafts.map((draft) =>
            draft.id === id
              ? {
                  ...draft,
                  posts,
                  updatedAt: new Date().toISOString(),
                }
              : draft,
          ),
        }));
      },

      deleteDraft: (id) => {
        set((state) => ({
          drafts: state.drafts.filter((draft) => draft.id !== id),
        }));
      },

      setModalOpen: (isOpen) => {
        set({ isModalOpen: isOpen });
      },

      saveAutoSave: (posts) => {
        set({ autosave: { posts } });
      },

      clearAutoSave: () => {
        set({ autosave: null });
      },
    }),
    {
      name: "crosspost-drafts",
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence across browser sessions
    },
  ),
);
