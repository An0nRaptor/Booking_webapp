/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"]
            },
            colors: {
                brand: {
                    50: "#fff1f3",
                    100: "#ffe1e6",
                    200: "#ffc7d1",
                    300: "#ff9cad",
                    400: "#ff5f7e",
                    500: "#f5385d",
                    600: "#e01e4a",
                    700: "#bd133d",
                    800: "#9e1339",
                    900: "#871437"
                }
            },
            maxWidth: { page: "84rem" }
        }
    },
    plugins: []
};
