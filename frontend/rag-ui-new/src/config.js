/**
 * Centralized frontend configuration.
 *
 * Every URL reference in the codebase should use these constants
 * instead of hardcoding localhost addresses.
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const QDRANT_URL = import.meta.env.VITE_QDRANT_URL || 'http://localhost:6333';

export default { API_URL, QDRANT_URL };
