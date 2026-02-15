
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2CBFAE", // Soft Teal
          active: "#249C8F",
          light: "#EAF9F7",
        },
        secondary: {
          DEFAULT: "#1E2A38", // Deep Blue
          light: "#2C3E50",
        },
        accent: {
          DEFAULT: "#FF7A70", // Coral
        },
        background: "#F9FAFB",
        surface: "#FFFFFF",
        text: {
          primary: "#1E2A38",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-poppins)", "sans-serif"],
      },
      borderRadius: {
        'lg': '12px',
        'md': '8px',
        'sm': '4px',
      }
    },
  },
  plugins: [],
};
export default config;
