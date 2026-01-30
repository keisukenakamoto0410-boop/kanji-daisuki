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
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        destructive: "var(--destructive)",
        success: "var(--success)",
        // New brand colors
        sakura: {
          DEFAULT: "var(--sakura)",
          dark: "var(--sakura-dark)",
          light: "var(--sakura-light)",
        },
        sky: {
          DEFAULT: "var(--sky)",
          dark: "var(--sky-dark)",
        },
        matcha: {
          DEFAULT: "var(--matcha)",
          dark: "var(--matcha-dark)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          dark: "var(--accent-dark)",
        },
      },
      fontFamily: {
        sans: ["Noto Sans JP", "M PLUS Rounded 1c", "sans-serif"],
        serif: ["Noto Serif JP", "serif"],
        display: ["M PLUS Rounded 1c", "Noto Sans JP", "sans-serif"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-reverse": "float-reverse 7s ease-in-out infinite",
        "drift": "drift 8s ease-in-out infinite",
        "sakura-fall": "sakura-fall 10s linear infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)", opacity: "0.15" },
          "50%": { transform: "translateY(-20px) rotate(5deg)", opacity: "0.25" },
        },
        "float-reverse": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)", opacity: "0.12" },
          "50%": { transform: "translateY(20px) rotate(-5deg)", opacity: "0.2" },
        },
        drift: {
          "0%, 100%": { transform: "translateX(0) translateY(0)" },
          "25%": { transform: "translateX(10px) translateY(-10px)" },
          "50%": { transform: "translateX(0) translateY(-20px)" },
          "75%": { transform: "translateX(-10px) translateY(-10px)" },
        },
        "sakura-fall": {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0" },
        },
        "pulse-soft": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.9" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "gradient-sakura": "linear-gradient(135deg, #FFB7C5 0%, #ff8fa3 100%)",
        "gradient-sky": "linear-gradient(135deg, #87CEEB 0%, #5eb8e4 100%)",
        "gradient-matcha": "linear-gradient(135deg, #88B04B 0%, #6d8f3a 100%)",
        "gradient-accent": "linear-gradient(135deg, #E63946 0%, #c62d39 100%)",
      },
      boxShadow: {
        "sakura": "0 4px 14px 0 rgba(255, 183, 197, 0.39)",
        "sky": "0 4px 14px 0 rgba(135, 206, 235, 0.39)",
        "matcha": "0 4px 14px 0 rgba(136, 176, 75, 0.39)",
      },
    },
  },
  plugins: [],
};
export default config;
