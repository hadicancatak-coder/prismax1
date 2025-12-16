/**
 * Campaign Domain - Single Source of Truth
 * All campaign-related constants, types, and configurations
 */

// Campaign statuses for utm_campaigns (main campaigns)
export const CAMPAIGN_STATUSES = ['Draft', 'Active', 'Paused', 'Completed', 'Archived'] as const;
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number];

// Campaign types
export const CAMPAIGN_TYPES = ['Brand', 'Performance', 'Awareness', 'Launch', 'Seasonal', 'Promotional'] as const;
export type CampaignType = typeof CAMPAIGN_TYPES[number];

// Entity tracking statuses
export const ENTITY_TRACKING_STATUSES = ['Draft', 'In Review', 'Approved', 'Live', 'Paused', 'Completed'] as const;
export type EntityTrackingStatus = typeof ENTITY_TRACKING_STATUSES[number];

// Campaign status configuration for UI
export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bgColor: string }> = {
  Draft: { label: 'Draft', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  Active: { label: 'Active', color: 'text-success', bgColor: 'bg-success/15' },
  Paused: { label: 'Paused', color: 'text-warning', bgColor: 'bg-warning/15' },
  Completed: { label: 'Completed', color: 'text-primary', bgColor: 'bg-primary/15' },
  Archived: { label: 'Archived', color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
};

// Campaign type configuration for UI
export const CAMPAIGN_TYPE_CONFIG: Record<CampaignType, { label: string; color: string }> = {
  Brand: { label: 'Brand', color: 'text-primary' },
  Performance: { label: 'Performance', color: 'text-success' },
  Awareness: { label: 'Awareness', color: 'text-info' },
  Launch: { label: 'Launch', color: 'text-warning' },
  Seasonal: { label: 'Seasonal', color: 'text-secondary' },
  Promotional: { label: 'Promotional', color: 'text-accent' },
};

// Entity tracking status configuration
export const ENTITY_STATUS_CONFIG: Record<EntityTrackingStatus, { label: string; color: string; bgColor: string }> = {
  Draft: { label: 'Draft', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  'In Review': { label: 'In Review', color: 'text-warning', bgColor: 'bg-warning/15' },
  Approved: { label: 'Approved', color: 'text-success', bgColor: 'bg-success/15' },
  Live: { label: 'Live', color: 'text-primary', bgColor: 'bg-primary/15' },
  Paused: { label: 'Paused', color: 'text-warning', bgColor: 'bg-warning/15' },
  Completed: { label: 'Completed', color: 'text-success', bgColor: 'bg-success/15' },
};

// Dropdown options for forms
export const CAMPAIGN_STATUS_OPTIONS = CAMPAIGN_STATUSES.map(status => ({
  value: status,
  label: CAMPAIGN_STATUS_CONFIG[status].label,
}));

export const CAMPAIGN_TYPE_OPTIONS = CAMPAIGN_TYPES.map(type => ({
  value: type,
  label: CAMPAIGN_TYPE_CONFIG[type].label,
}));

export const ENTITY_STATUS_OPTIONS = ENTITY_TRACKING_STATUSES.map(status => ({
  value: status,
  label: ENTITY_STATUS_CONFIG[status].label,
}));
