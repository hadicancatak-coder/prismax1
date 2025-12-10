/**
 * Centralized constants for the application
 * All entity/country lists and team definitions should use these constants
 */

export const ENTITIES = [
  "Global Management",
  "Jordan",
  "UAE",
  "Lebanon",
  "Kuwait",
  "Iraq",
  "UK",
  "Nigeria",
  "Qatar",
  "India",
  "South Africa",
  "Egypt",
  "Malaysia",
  "Chile",
  "Vietnam",
  "Bahrain",
  "Palestine",
  "Azerbaijan",
  "Seychelles",
  "Mauritius",
  "Vanuatu"
];

export const TEAMS = ["SocialUA", "PPC", "PerMar"];

// Display labels for teams (for UI)
export const TEAM_LABELS: Record<string, string> = {
  "SocialUA": "Social UA",
  "PPC": "PPC",
  "PerMar": "Performance Marketing"
};

/**
 * Task Statuses - Single Source of Truth
 * UI uses these values, mapper converts to DB values when needed
 */
export const TASK_STATUSES = [
  { value: "Backlog", label: "Backlog", dbValue: "Pending" },
  { value: "Ongoing", label: "Ongoing", dbValue: "Ongoing" },
  { value: "Blocked", label: "Blocked", dbValue: "Blocked" },
  { value: "Completed", label: "Completed", dbValue: "Completed" },
] as const;

export type TaskStatus = typeof TASK_STATUSES[number]['value'];

/**
 * Task Tags - Single Source of Truth
 */
export const TASK_TAGS = [
  { value: "reporting", label: "Reporting", color: "bg-primary/15 text-primary border-primary/30" },
  { value: "campaigns", label: "Campaigns", color: "bg-success/15 text-success border-success/30" },
  { value: "tech", label: "Tech", color: "bg-info/15 text-info border-info/30" },
  { value: "problems", label: "Problems", color: "bg-destructive/15 text-destructive border-destructive/30" },
  { value: "l&d", label: "L&D", color: "bg-warning/15 text-warning border-warning/30" },
  { value: "research", label: "Research", color: "bg-accent text-accent-foreground border-border" },
] as const;

export type TaskTag = typeof TASK_TAGS[number]['value'];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export type Entity = typeof ENTITIES[number];
export type Team = typeof TEAMS[number];
export type Month = typeof MONTHS[number];
