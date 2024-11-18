/** @type {import('tailwindcss').Config} */
export default {
  mode: "jit",
  content: ["./src/**/*.{js,ts,jsx,tsx,html,mdx}", "./src/**/*.{js,ts,jsx,tsx,html,mdx}"],

  theme: {
   
    extend: { 
      colors: {
      customColor1: '#093F4E',
      customcyan: "#1985A1",
      customgray: "#DCDCDD",
      customdarkgray: "#C5C3C6",
      customdarkgray2: "#46494C",
      customdarkgray3: "#4C5C68",
      customdarkgray4: "#D9D9D9",
      customgraybg: {
        DEFAULT: '#46494C', // Your base color
        50: 'rgba(70, 73, 76, 0.5)', // Your color with 50% transparency
      gray: { "300": "#dcdcdc", "400": "#c5c3c6", "800": "#46494c", "800_7f": "#46494c7f" },
        blue_gray: { "100": "#d9d9d9", "300": "#4c5c68" },
        black: { "900": "#000000", "900_3f": "#0000003f" },
        teal: { "900": "#093f4d", "900_01": "#093f4e" },
        cyan: { "800": "#195831" },
        white: { "700": "#ffffff" }},
      
    },
    
      fontFamily: {
        montserrat: "Montserrat",
        opensanshebrew: "Open Sans Hebrew",
        opensans: "Open Sans",
        bakabone: "Bakbak One",
      'bakbak-one': ['Bakbak One', 'sans-serif'],
      'montserrat': ['Montserrat', 'sans-serif'],
      'open-sans': ['Open Sans', 'sans-serif'],
   },
   textShadow: { "ts": "0px 4px 4px #0000003f" }
  },
  plugins: [require("@tailwindcss/forms")],
}
}