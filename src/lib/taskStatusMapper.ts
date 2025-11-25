// Status transformation layer to handle UI/DB mismatch
// UI uses "Backlog" but database uses "Pending"

export const STATUS_UI_TO_DB = {
  'Backlog': 'Pending',
  'Ongoing': 'Ongoing',
  'Completed': 'Completed',
  'Failed': 'Failed',
  'Blocked': 'Blocked'
} as const;

export const STATUS_DB_TO_UI = {
  'Pending': 'Backlog',
  'Ongoing': 'Ongoing',
  'Completed': 'Completed',
  'Failed': 'Failed',
  'Blocked': 'Blocked'
} as const;

export type UIStatus = keyof typeof STATUS_UI_TO_DB;
export type DBStatus = keyof typeof STATUS_DB_TO_UI;

export const mapStatusToDb = (status: string): string => {
  return STATUS_UI_TO_DB[status as UIStatus] || status;
};

export const mapStatusToUi = (status: string): string => {
  return STATUS_DB_TO_UI[status as DBStatus] || status;
};
