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
                whatsapp: {
                    green: "#25D366",
                    "green-dark": "#128C7E",
                    "green-light": "#075E54",
                    teal: "#34B7F1",
                    white: "#ECE5DD",
                    "chat-bg": "#E5DDD5"
                }
            },
            backgroundImage: {
                "whatsapp-gradient": "linear-gradient(to right, #128C7E, #25D366)",
            }
        },
    },
    plugins: [],
};
export default config;
