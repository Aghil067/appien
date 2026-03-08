import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#ffb732',
                'primary-dark': '#e6a42d',
                orange: {
                    50: '#fffbf0',
                    100: '#ffefd1',
                    200: '#ffdcb3',
                    300: '#ffc58a',
                    400: '#ffb732',
                    500: '#ffb732', // Main Brand Color
                    600: '#e6a42d', // Slightly darker for hover states
                    700: '#cc9228',
                    800: '#b38023',
                    900: '#996e1e',
                    950: '#664914',
                },
                'surface': '#f9fafb',
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
        },
    },
    plugins: [],
    darkMode: 'class',
};
export default config;