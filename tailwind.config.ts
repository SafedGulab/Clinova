import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { navy: "#0B2545", teal: { DEFAULT: "#13A89E" }, mist: "#F2F7FC" },
    },
  },
  plugins: [],
};
export default config;
