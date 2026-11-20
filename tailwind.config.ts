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
        brand: {
          ink: "#20342B",
          muted: "#78867D",
          green: "#2F7651",
          greenDark: "#245D40",
          mint: "#E5F3E9",
          mintSoft: "#F3F8F3",
          orange: "#F5A36C",
          peach: "#FFF0E7",
          line: "#E7EDE8",
          yellow: "#F5B942",
          red: "#C75C52",
        },
      },
    },
  },
  plugins: [],
};
export default config;
