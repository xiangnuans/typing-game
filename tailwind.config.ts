import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: 'var(--button-bg)',
        secondary: 'var(--button-hover)',
        bg: 'var(--bg-color)',
        text: 'var(--text-color)',
        'card-bg': 'var(--card-bg)',
        'border-color': 'var(--border-color)',
      },
    },
  },
  plugins: [],
};
export default config;
