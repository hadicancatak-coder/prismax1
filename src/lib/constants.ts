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
  "Oman",
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
