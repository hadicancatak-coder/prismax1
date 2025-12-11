import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// =============================================================================
// PRISMA DESIGN SYSTEM - ESLint Token Enforcement
// =============================================================================
// These rules prevent raw Tailwind classes and enforce semantic tokens.
// See STYLE_GUIDE.md for the complete token reference.
// =============================================================================

// Banned patterns with their correct replacements
const BANNED_PATTERNS = {
  // Typography - Use semantic text tokens instead
  typography: {
    pattern: "\\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)\\b",
    message: "Use semantic typography tokens: text-metadata, text-body-sm, text-body, text-heading-sm, text-heading-md, text-heading-lg, text-page-title",
  },
  // Gap spacing - Use semantic gap tokens instead
  gap: {
    pattern: "\\bgap-(0|1|2|3|4|5|6|8|10|12|16|20|24)\\b",
    message: "Use semantic gap tokens: gap-xs (4px), gap-sm (8px), gap-md (16px), gap-lg (24px), gap-xl (32px)",
  },
  // Space-y/x - Use semantic spacing instead
  spaceY: {
    pattern: "\\bspace-[xy]-(0|1|2|3|4|5|6|8|10|12)\\b",
    message: "Use semantic spacing: space-y-xs, space-y-sm, space-y-md, space-y-lg or gap tokens",
  },
  // Padding - Use semantic padding tokens
  padding: {
    pattern: "\\bp[xytblr]?-(0|1|2|3|4|5|6|8|10|12|16|20|24)\\b",
    message: "Use semantic padding: p-xs (4px), p-sm (8px), p-md (16px), p-lg (24px), p-card (16px)",
  },
  // Margin - Use semantic margin tokens
  margin: {
    pattern: "\\bm[xytblr]?-(0|1|2|3|4|5|6|8|10|12|16|20|24)\\b",
    message: "Use semantic margin: mt-section, mb-section, mb-card or spacing tokens",
  },
  // Hardcoded colors - Use semantic color tokens
  hardcodedColors: {
    pattern: "\\b(text|bg|border)-(white|black|gray-\\d+|slate-\\d+|zinc-\\d+|neutral-\\d+|stone-\\d+)\\b",
    message: "Use semantic color tokens: text-foreground, text-muted-foreground, bg-background, bg-card, bg-muted, border-border",
  },
  // Raw color values - Use HSL semantic tokens
  rawColors: {
    pattern: "\\b(text|bg|border)-\\[(#[0-9a-fA-F]{3,8}|rgb|rgba|hsl)\\b",
    message: "Use semantic color tokens from index.css. No arbitrary color values allowed.",
  },
};

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      
      // =======================================================================
      // PRISMA TOKEN ENFORCEMENT RULES
      // =======================================================================
      // These rules are set to "warn" to show violations without blocking builds.
      // When ready to enforce strictly, change "warn" to "error".
      // =======================================================================
      
      // Ban raw typography classes
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/\\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)\\b/]",
          message: BANNED_PATTERNS.typography.message,
        },
        {
          selector: "TemplateElement[value.raw=/\\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)\\b/]",
          message: BANNED_PATTERNS.typography.message,
        },
        {
          selector: "Literal[value=/\\bgap-(0|1|2|3|4|5|6|8|10|12|16|20|24)\\b/]",
          message: BANNED_PATTERNS.gap.message,
        },
        {
          selector: "TemplateElement[value.raw=/\\bgap-(0|1|2|3|4|5|6|8|10|12|16|20|24)\\b/]",
          message: BANNED_PATTERNS.gap.message,
        },
        {
          selector: "Literal[value=/\\b(text|bg|border)-(white|black|gray-\\d+)\\b/]",
          message: BANNED_PATTERNS.hardcodedColors.message,
        },
        {
          selector: "TemplateElement[value.raw=/\\b(text|bg|border)-(white|black|gray-\\d+)\\b/]",
          message: BANNED_PATTERNS.hardcodedColors.message,
        },
      ],
    },
  },
);
