import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the production URL for public links.
 * Uses VITE_PUBLIC_URL if set, otherwise derives from project ID.
 * Falls back to current origin for local development.
 */
export function getProductionUrl(): string {
  // If VITE_PUBLIC_URL is explicitly set (for custom domains)
  if (import.meta.env.VITE_PUBLIC_URL) {
    return import.meta.env.VITE_PUBLIC_URL;
  }
  // Derive from Supabase project ID for Lovable production URL
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (projectId) {
    return `https://${projectId}.lovable.app`;
  }
  // Fallback for local development
  return window.location.origin;
}
