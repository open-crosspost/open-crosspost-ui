# V2 Architecture Plan: Contract-Centric Authorization

This document outlines the long-term architectural direction for authorization, leveraging a NEAR smart contract and Function Call Access Keys (FCAKs). This approach aims to enhance security and align with blockchain principles, supporting both user-driven frontends and automated agents.

## Core Concepts

- **Source of Truth:** A dedicated NEAR smart contract will manage authorization rules, determining if a user (via Full Access Key - FAK) or an agent/application (via Function Call Access Key - FCAK) has permission to perform specific actions.
- **Backend Validation:** The backend API will validate _every_ incoming request by verifying the attached NEAR signature (FAK or FCAK) against the smart contract's authorization logic.
- **No Session Tokens:** This model eliminates the need for backend-generated session tokens (like JWTs) and associated client-side storage complexities/risks.

## Smart Contract Requirements

- **FCAK Registration:** Method allowing users (via wallet/FAK) to register FCAKs for specific agents/apps, potentially with scoped permissions (e.g., specific actions, rate limits).
- **FCAK Revocation:** Method allowing users to revoke previously granted FCAKs.
- **Authorization Check:** View method(s) for the backend API to query: "Is public key X (FAK or FCAK) authorized for account ID Y to perform action Z?"

## SDK (`CrosspostClient`) Changes

- **Token Logic Removal:** Eliminate all JWT/refresh token handling, storage, and interceptors.
- **`authorize()`:** Guides the user through the wallet transaction to register the necessary FCAK(s) on the smart contract. Sets a simple `localStorage` flag (`crosspost:authorized`) for UI purposes only. Emits `AUTHORIZED` event.
- **`unauthorize()`:** Guides the user through the wallet transaction to revoke the FCAK(s) on the smart contract. Clears the `localStorage` flag. Emits `AUTHORIZATION_REVOKED` event.
- **`authenticate()`:** Remains responsible for generating the `NearAuthData` payload by signing with the user's wallet (FAK).
- **API Methods:** _All_ methods making backend calls will require the `NearAuthData` payload (from `authenticate`) as input and will send the signature details to the backend for contract validation.
- **`isAuthenticated()`:** Deprecated/removed. Frontend UI relies on the `localStorage` flag; API security relies on backend contract validation.

## Frontend Changes

- **`useAuthorizationStatus`:** Checks the simple `localStorage` flag.
- **`AuthorizationModal`:** Triggers the SDK's `authorize()` method (contract interaction).
- **API Calls:** _All_ API calls (reads and writes) must first call `authenticate()` and pass the resulting payload to the SDK method.

## UX Considerations & Potential Optimizations

- **Initial Drawback:** Requires the frontend user to sign _every_ API request via their wallet, including reads.
- **Future Optimization:** Explore registering a _limited, read-only FCAK_ specifically for the frontend during the `authorize()` flow. The SDK could store this key (e.g., in `localStorage`, accepting the risk for a less powerful key) and use it to auto-sign non-sensitive GET requests, improving UX by avoiding wallet prompts for reads. Sensitive writes would still require a signature from the user's main wallet (FAK). This requires more sophisticated contract design and SDK logic.

## Transition

This represents a significant shift from the current or intermediate state. Implementation will require coordinated changes across the smart contract, backend API, SDK, and frontend applications.
