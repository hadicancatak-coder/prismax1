// Status transformation layer to handle UI/DB mismatch
// UI uses "Backlog" but database uses "Pending"

import { TASK_STATUSES } from "./constants";

// Build maps from the single source of truth
export const STATUS_UI_TO_DB: Record<string, string> = TASK_STATUSES.reduce((acc, s) => {
  acc[s.value] = s.dbValue;
  return acc;
}, {} as Record<string, string>);

export const STATUS_DB_TO_UI: Record<string, string> = TASK_STATUSES.reduce((acc, s) => {
  acc[s.dbValue] = s.value;
  return acc;
}, {} as Record<string, string>);

export type UIStatus = typeof TASK_STATUSES[number]['value'];
export type DBStatus = typeof TASK_STATUSES[number]['dbValue'];

/**
 * Convert UI status to database status
 * e.g., "Backlog" -> "Pending"
 */
export const mapStatusToDb = (status: string): string => {
  return STATUS_UI_TO_DB[status] || status;
};

/**
 * Convert database status to UI status
 * e.g., "Pending" -> "Backlog"
 */
export const mapStatusToUi = (status: string): string => {
  return STATUS_DB_TO_UI[status] || status;
};

/**
 * Get all valid UI status values
 */
export const getUIStatuses = (): string[] => {
  return TASK_STATUSES.map(s => s.value);
};

/**
 * Check if a status requires a reason (e.g., Blocked)
 */
export const statusRequiresReason = (status: string): boolean => {
  return status === 'Blocked';
};
