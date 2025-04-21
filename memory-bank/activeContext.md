# Active Context: Open Crosspost

## Current Focus: Authorization Flow Refinement & UX Improvements

Following the initial refactor of the authentication/authorization system, the current focus is on refining the flow for better user experience and preparing for future architectural changes.

## Recent Changes

-   **Authorization/Authentication Separation:** Refactored the system to distinguish between:
    -   **Authorization:** One-time app permission grant, persisted in `localStorage`. Handled by `authorization-service.ts`, `useAuthorizationStatus`, `AuthorizationModal`.
    -   **Authentication:** Per-request identity proof using NEAR wallet signatures. Handled by `authentication-service.ts`.
-   **File Renaming/Restructuring:** Renamed and moved relevant files (e.g., `use-authorization-status.ts`, `authorization-service.ts`, `authentication-service.ts`).
-   **Cleanup:** Removed old auth files and updated imports across the application.
-   **Persistence Fix:** Authorization status (`crosspost:authorized` flag in `localStorage`) now correctly persists across sessions.
-   **Blank Page Fix:** Resolved the issue where the app showed a blank page after initial authorization.

## Current Requirements & Immediate Plan

### Improve UX for Read Operations (GET Requests)

1.  **Problem:** Currently, every API call (including reads like fetching leaderboards or connected accounts) requires a wallet signature via the `authenticate()` function, leading to frequent prompts and poor UX.
2.  **Assumption:** The backend API does **not** require NEAR signature authentication for non-sensitive GET requests (e.g., `/leaderboard`, `/accounts`, `/status`). These endpoints are considered safe to access without per-request signatures, likely relying on implicit user context if needed, or returning public/non-sensitive data.
3.  **Immediate Plan:**
    *   Modify frontend code (specifically React Query hooks in `platform-accounts-store.ts` and the fetch logic in `leaderboard/index.tsx`) to **remove** the `authenticate()` call before making these non-sensitive GET requests.
    *   Keep the `authenticate()` call **only** for sensitive write operations (`createPost`, `revokeAuth`, `refreshProfile`, `loginToPlatform`).

## Design Decisions

1.  **Authorization State:** The `useAuthorizationStatus` hook, based on the `localStorage` flag, remains the primary control for UI elements requiring prior user authorization (e.g., showing the main app content vs. the `AuthorizationModal`).
2.  **Selective Authentication:** Implement a pattern where only specific, sensitive API calls trigger the per-request `authenticate()` flow. Non-sensitive reads bypass this step.

## Next Steps (Immediate)

1.  Modify `src/store/platform-accounts-store.ts`: Remove `authenticate()` calls within `useConnectedAccounts` and `useCheckAccountStatus`.
2.  Modify `src/routes/_layout/_crosspost/leaderboard/index.tsx`: Remove `authenticate()` call within `fetchLeaderboard`.
3.  Verify that `useConnectAccount`, `useDisconnectAccount`, `useRefreshAccount` (in `platform-accounts-store.ts`) and the post submission logic (in `editor/index.tsx`) *still* correctly call `authenticate()` before their respective API calls.
4.  Test the application thoroughly to ensure reads work without signature prompts and writes still prompt for signatures correctly.
5.  Address the `TODO` in `authorization-service.ts` regarding `client.unauthorizeNearAccount()` - confirm if backend/SDK support exists or remove the comment.

## Future Direction (V2)

The long-term plan involves moving towards a contract-centric authorization model using FCAKs, as detailed in `memory-bank/v2-architecture-plan.md`. This will eventually replace the current selective authentication approach.

## Open Questions

-   Confirm backend API behavior: Does it truly allow GET requests for leaderboard, accounts, status without *any* authentication (signature or otherwise)?
-   Does the SDK/backend support an explicit `unauthorizeNearAccount` call? (Relates to the TODO).
