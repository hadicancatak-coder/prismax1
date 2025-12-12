/**
 * Status transformation layer to handle UI/DB mismatch
 * @deprecated This file is deprecated. Import from '@/domain' instead.
 * Kept for backwards compatibility during migration.
 */

// Re-export everything from domain layer
export {
  STATUS_UI_TO_DB,
  STATUS_DB_TO_UI,
  mapStatusToDb,
  mapStatusToUi,
  statusRequiresReason,
  getAllUIStatuses as getUIStatuses,
  type TaskStatusUIType as UIStatus,
  type TaskStatusDBType as DBStatus,
} from '@/domain';
