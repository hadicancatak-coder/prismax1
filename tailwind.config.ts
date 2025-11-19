import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          hover: "hsl(var(--muted-hover))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          hover: "hsl(var(--accent-hover))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        pending: {
          DEFAULT: "hsl(var(--pending))",
          foreground: "hsl(var(--pending-foreground))",
        },
        gray: {
          50: "hsl(var(--gray-50))",
          100: "hsl(var(--gray-100))",
          200: "hsl(var(--gray-200))",
          300: "hsl(var(--gray-300))",
          400: "hsl(var(--gray-400))",
          500: "hsl(var(--gray-500))",
          600: "hsl(var(--gray-600))",
          700: "hsl(var(--gray-700))",
          800: "hsl(var(--gray-800))",
          900: "hsl(var(--gray-900))",
        },
      },
      transitionProperty: {
        'smooth': 'all',
      },
      transitionDuration: {
        'DEFAULT': '150ms',
      },
      transitionTimingFunction: {
        'DEFAULT': 'ease-in-out',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',      /* 6px */
        DEFAULT: 'var(--radius-md)',    /* 8px */
        'md': 'var(--radius-md)',       /* 8px */
        'lg': 'var(--radius-lg)',       /* 12px */
        'xl': 'var(--radius-xl)',       /* 16px */
      },
      fontSize: {
        'metadata': 'var(--text-metadata)',        /* 12px */
        'body-sm': 'var(--text-body-sm)',          /* 14px */
        'body': 'var(--text-body)',                /* 16px */
        'heading-sm': 'var(--text-heading-sm)',    /* 18px */
        'heading-md': 'var(--text-heading-md)',    /* 20px */
        'heading-lg': 'var(--text-heading-lg)',    /* 24px */
        'page-title': 'var(--text-page-title)',    /* 30px */
      },
      spacing: {
        '1': 'var(--spacing-1)',
        '2': 'var(--spacing-2)',
        '3': 'var(--spacing-3)',
        '4': 'var(--spacing-4)',
        '6': 'var(--spacing-6)',
        '8': 'var(--spacing-8)',
        '12': 'var(--spacing-12)',
        '16': 'var(--spacing-16)',
        '24': 'var(--spacing-24)',
        '48': '12rem', /* 48px rhythm */
        'xs': 'var(--space-xs)',      /* 8px */
        'sm': 'var(--space-sm)',      /* 12px */
        'md': 'var(--space-md)',      /* 16px */
        'lg': 'var(--space-lg)',      /* 24px */
        'xl': 'var(--space-xl)',      /* 32px */
        '2xl': 'var(--space-2xl)',    /* 48px */
      },
      gap: {
        'xs': 'var(--space-xs)',      /* 8px */
        'sm': 'var(--space-sm)',      /* 12px */
        'md': 'var(--space-md)',      /* 16px */
        'lg': 'var(--space-lg)',      /* 24px */
        'xl': 'var(--space-xl)',      /* 32px */
        '2xl': 'var(--space-2xl)',    /* 48px */
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "shimmer": {
          "0%": { 
            backgroundPosition: "-1000px 0"
          },
          "100%": { 
            backgroundPosition: "1000px 0"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 150ms ease-in-out",
        "accordion-up": "accordion-up 150ms ease-in-out",
        "fade-in": "fade-in 150ms ease-in-out",
        "shimmer": "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
