# ADR-0011: React Query and Zustand for Frontend State Management

## Status
Accepted

## Context
All three frontends (user-ui, seller-ui, admin-ui) are Next.js applications that
need to manage two distinct categories of state: server state (data fetched from APIs
that can become stale, needs caching and background refresh) and client state (UI
state, form state, global app state that has no server representation). Using a single
state manager for both leads to over-complicated stores and manual cache invalidation.

## Decision
We split state management by category:

- **React Query (TanStack Query v5)** for all server state: data fetching, caching,
  background refetching, optimistic updates, and mutations. All API calls go through
  `useQuery` / `useMutation` hooks, never through `useEffect`.
- **Zustand v5** for all client state: UI visibility (modals, drawers), auth session,
  cart/wishlist state, and any global app state with no server representation.

`useEffect` is reserved exclusively for true side effects (DOM manipulation, event
listeners, subscriptions). It is never used for data fetching or state synchronisation.

## Alternatives Considered
- **Redux Toolkit + RTK Query** — comprehensive but significantly more boilerplate;
  RTK Query covers server state but Zustand is simpler for pure client state.
- **SWR** — similar to React Query but less feature-rich (no mutation helpers,
  no devtools, less flexible cache management).
- **Context API for global state** — causes unnecessary re-renders across the tree;
  Zustand is more performant with selective subscriptions.
- **Single Redux store for everything** — conflates server cache management with
  UI state, leading to complex selector logic and manual cache invalidation.

## Consequences
- **Positive:** Server cache is automatically managed (stale-while-revalidate,
  background refresh, request deduplication); Zustand stores are minimal and
  co-located with the features they serve.
- **Negative:** Two separate libraries require developers to understand which tool
  applies to which state category; incorrect use (e.g., fetching in Zustand) leads
  to stale data bugs.

## Trade-offs
Two-library complexity was accepted over the simpler single-store approach because
the separation of concerns between server cache and client state produces more
predictable behaviour and eliminates a class of stale-data bugs.
