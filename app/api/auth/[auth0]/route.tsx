import { handleAuth } from "@auth0/nextjs-auth0/edge";

/**
 * @title Auth0 API
 * Authentication endpoints using Auth0
 * @category api
 */

/**
 * @title Authentication Handler
 * @remarks
 * Handles Auth0 authentication routes:
 * - /api/auth/login
 * - /api/auth/logout
 * - /api/auth/callback
 *
 * @returns {Promise<Response>} Authentication response
 */
export const GET = handleAuth();

/**
 * @title Runtime Configuration
 * @remarks
 * Edge runtime configuration for Auth0
 */
export const runtime = "edge";
