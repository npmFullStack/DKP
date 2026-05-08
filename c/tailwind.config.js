/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#FF3333",
                secondary: "#1A1A1A",
                bgColor: "#0A0A0A"
            },
            fontFamily: {
                sans: ["Google Sans", "sans-serif"],
                logo: ["Anton", "sans-serif"],
                heading: ["Anton", "sans-serif"]
            }
        }
    },
    plugins: [],
}