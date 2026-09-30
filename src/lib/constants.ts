/**
 * constants.ts
 * Centralized Stellar network constants for Frontend and Backend.
 *
 * The single source of truth lives in `shared/constants.ts` (kept free of
 * Vite build-tool globals so Node processes can import it too). This module
 * re-exports it so the frontend's public API (`src/lib/stellar.ts` and every
 * component) is unchanged.
 */

export * from '../../shared/constants'
