import { formatMonthYear2Digit } from "./utmHelpers";

export interface VariableCategory {
  name: string;
  variables: VariableDefinition[];
}

export interface VariableDefinition {
  key: string;
  label: string;
  description: string;
  example: string;
}

export const UTM_VARIABLE_CATEGORIES: VariableCategory[] = [
  {
    name: "Platform",
    variables: [
      { key: "{platform}", label: "Platform", description: "Platform name (lowercase, underscored)", example: "google_ads" },
      { key: "{platformCode}", label: "Platform Code", description: "First 3 letters", example: "goo" },
    ],
  },
  {
    name: "Campaign",
    variables: [
      { key: "{campaign}", label: "Campaign", description: "Campaign name (lowercase, underscored)", example: "summer_sale" },
      { key: "{campaignCode}", label: "Campaign Code", description: "First 5 letters (underscored)", example: "summe" },
    ],
  },
  {
    name: "Date",
    variables: [
      { key: "{monthYY}", label: "Month Year (2-digit)", description: "Short month + 2-digit year", example: "nov25" },
      { key: "{monthYear}", label: "Month Year", description: "Short month + full year", example: "Nov2025" },
      { key: "{month}", label: "Month", description: "2-digit month", example: "11" },
      { key: "{year}", label: "Year", description: "Full year", example: "2025" },
      { key: "{YY}", label: "Year (2-digit)", description: "Last 2 digits of year", example: "25" },
    ],
  },
  {
    name: "Entity",
    variables: [
      { key: "{entity}", label: "Entity", description: "Entity name (lowercase, underscored)", example: "my_company" },
      { key: "{entityCode}", label: "Entity Code", description: "First 3 letters", example: "my_" },
    ],
  },
  {
    name: "Location",
    variables: [
      { key: "{city}", label: "City", description: "City name (lowercase, underscored)", example: "abu_dhabi" },
      { key: "{country}", label: "Country", description: "Country code", example: "ae" },
    ],
  },
  {
    name: "Device",
    variables: [
      { key: "{device}", label: "Device", description: "Device type (lowercase, underscored)", example: "mobile_app" },
    ],
  },
  {
    name: "Custom",
    variables: [
      { key: "{webinar}", label: "Webinar", description: "Webinar name (lowercase, underscored)", example: "summer_webinar" },
      { key: "{purpose}", label: "Purpose", description: "Campaign purpose (lowercase, underscored)", example: "brand_awareness" },
    ],
  },
  {
    name: "Separators",
    variables: [
      { key: "_", label: "Underscore", description: "Underscore separator", example: "_" },
      { key: "-", label: "Dash", description: "Dash separator", example: "-" },
      { key: "/", label: "Slash", description: "Slash separator", example: "/" },
    ],
  },
];

export interface UtmRuleContext {
  platform: string;
  campaign: string;
  entity?: string;
  lpUrl: string;
  webinar?: string;
  city?: string;
  device?: string;
  date?: Date;
  purpose?: string;
}

export function replaceVariables(template: string, context: UtmRuleContext): string {
  const now = context.date || new Date();
  
  // Build variable map
  const variables: Record<string, string> = {
    "{platform}": context.platform.toLowerCase().replace(/\s+/g, "_"),
    "{platformCode}": context.platform.toLowerCase().replace(/\s+/g, "_").substring(0, 3),
    "{campaign}": context.campaign.toLowerCase().replace(/\s+/g, "_"),
    "{campaignCode}": context.campaign.toLowerCase().replace(/\s+/g, "_").substring(0, 5),
    "{entity}": context.entity?.toLowerCase().replace(/\s+/g, "_") || "",
    "{entityCode}": context.entity?.toLowerCase().replace(/\s+/g, "_").substring(0, 3) || "",
    "{city}": context.city?.toLowerCase().replace(/\s+/g, "_") || "",
    "{country}": "ae", // Default country
    "{webinar}": context.webinar?.toLowerCase().replace(/\s+/g, "_") || "",
    "{device}": context.device?.toLowerCase().replace(/\s+/g, "_") || "desktop",
    "{purpose}": context.purpose?.toLowerCase().replace(/\s+/g, "_") || "",
    "{monthYY}": formatMonthYear2Digit(now),
    "{monthYear}": `${now.toLocaleString('en', { month: 'short' })}${now.getFullYear()}`,
    "{month}": (now.getMonth() + 1).toString().padStart(2, "0"),
    "{year}": now.getFullYear().toString(),
    "{YY}": now.getFullYear().toString().slice(-2),
  };

  // Replace all variables
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.split(key).join(value);
  });

  return result;
}

export function validateTemplate(template: string): { valid: boolean; error?: string } {
  const allVariables = UTM_VARIABLE_CATEGORIES.flatMap(cat => cat.variables.map(v => v.key));
  const regex = /\{[^}]+\}/g;
  const matches = template.match(regex) || [];
  
  for (const match of matches) {
    if (!allVariables.includes(match) && match !== "_" && match !== "-" && match !== "/") {
      return {
        valid: false,
        error: `Invalid variable: ${match}. Use the variable selector to add valid variables.`,
      };
    }
  }
  
  return { valid: true };
}

export function getPreviewValue(template: string): string {
  const sampleContext: UtmRuleContext = {
    platform: "Google Ads",
    campaign: "Summer Sale",
    entity: "My Company",
    lpUrl: "https://example.com",
    city: "Abu Dhabi",
    device: "mobile app",
    date: new Date("2025-11-15"),
    purpose: "brand awareness",
  };
  
  return replaceVariables(template, sampleContext);
}
