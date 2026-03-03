// tailwind.config.cjs
module.exports = {
    darkMode: "class",
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx,js,jsx}"
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2b6cee",
                "background-light": "#f6f6f8",
                "background-dark": "#0f1115",
                "glass-border": "rgba(255, 255, 255, 0.1)",
                "glass-surface": "rgba(255, 255, 255, 0.03)"
            },
            fontFamily: {
                display: ["Inter", "sans-serif"],
                sans: ["Inter", "sans-serif"]
            },
            borderRadius: {
                DEFAULT: "0.5rem",
                lg: "1rem",
                xl: "1.5rem",
                "2xl": "2rem",
                full: "9999px"
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.01) 100%)"
            },
            boxShadow: {
                glass: "0 4px 30px rgba(0, 0, 0, 0.1)",
                glow: "0 0 20px rgba(43, 108, 238, 0.5)",
                "glow-sm": "0 0 10px rgba(43, 108, 238, 0.3)"
            }
        }
    },
    plugins: []
};