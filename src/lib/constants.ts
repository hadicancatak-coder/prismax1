/**
 * Centralized constants for the application
 * All entity/country lists and team definitions should use these constants
 */

export const ENTITIES = [
  "Jordan",
  "Lebanon",
  "Kuwait",
  "UAE",
  "South Africa",
  "Azerbaijan",
  "UK",
  "Latin America",
  "Seychelles",
  "Palestine",
  "Bahrain",
  "Qatar",
  "Global Management"
];

export const TEAMS = ["Social UA", "PPC"];

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
