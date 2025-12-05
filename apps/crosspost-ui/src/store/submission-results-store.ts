import {
  ConnectedAccount,
  ErrorDetail,
  MultiStatusSummary,
  SuccessDetail,
} from "@crosspost/types";
import { create } from "zustand";
import { PostType } from "../components/post-interaction-selector";
import { EditorContent } from "./drafts-store";

export interface SubmissionRequest {
  posts: EditorContent[];
  selectedAccounts: ConnectedAccount[];
  postType: PostType;
  targetUrl?: string;
}

export interface SubmissionResultsState {
  summary: MultiStatusSummary | null;
  results: SuccessDetail[];
  errors: ErrorDetail[];
  request: SubmissionRequest | null;
  setSubmissionOutcome: (data: {
    summary: MultiStatusSummary;
    results: SuccessDetail[];
    errors: ErrorDetail[];
    request: SubmissionRequest;
  }) => void;
  clearSubmissionOutcome: () => void;
}

const initialState: Omit<
  SubmissionResultsState,
  "setSubmissionOutcome" | "clearSubmissionOutcome"
> = {
  summary: null,
  results: [],
  errors: [],
  request: null,
};

export const useSubmissionResultsStore = create<SubmissionResultsState>(
  (set) => ({
    ...initialState,
    setSubmissionOutcome: (data) =>
      set({
        summary: data.summary,
        results: data.results,
        errors: data.errors,
        request: data.request,
      }),
    clearSubmissionOutcome: () => set(initialState),
  }),
);
