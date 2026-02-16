/** @format */

/**
 * Shared TypeScript type definitions.
 * Add cross-feature interfaces and types here.
 */

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
