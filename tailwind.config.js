/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // Enable class-based dark mode
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
                "3xl": "1720px",
                "4xl": "2048px",
            },
        },
        extend: {
            screens: {
                '3xl': '1920px',
                '4xl': '2560px',
            },
            maxWidth: {
                '8xl': '90rem',
                '9xl': '105rem',
                'ultrawide': '120rem',
            },
            colors: {
                // Primary palette (HSL vars)
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Sumi-e & Hanko Authentic Japanese Palette
                hanko: {
                    DEFAULT: "#E8483A",
                    hover: "#D33C2F",
                    dark: "#BF3226",
                    light: "#FDF2F0",
                },
                gold: {
                    DEFAULT: "#C9A961",
                    hover: "#B8964C",
                    light: "#FDF9EE",
                },
                sumi: {
                    bg: "#0F1419",
                    card: "#1A2028",
                    elevated: "#222B36",
                    border: "#26303B",
                    muted: "#8B8680",
                    text: "#F5F3F0",
                },
                // Exact hex palette for design spec
                "bg-light": "#F8F6F0",
                "surface-light": "#FFFFFF",
                "surface-elevated-light": "#F1EFEA",
                "text-light": "#1A2028",
                "muted-light": "#64748B",
                "border-light": "#E2DFD8",
                "primary-light": "#DC4433",
                "cyan-light": "#26B9E6",
                "accent-red-light": "#DC4433",
                "bg-dark": "#0F1419",
                "surface-dark": "#1A2028",
                "surface-elevated-dark": "#222B36",
                "text-dark": "#F5F3F0",
                "muted-dark": "#8B8680",
                "border-dark": "#26303B",
                "primary-dark": "#E8483A",
                "cyan-dark": "#38BDF8",
                "accent-red-dark": "#E8483A",
            },
            boxShadow: {
                xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ['Manrope', 'Noto Sans JP', 'system-ui', 'sans-serif'],
                display: ['Newsreader', 'Shippori Mincho', 'serif'],
                serif: ['Shippori Mincho', 'Newsreader', 'serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            // 3D Transform utilities for flashcard flip
            transformStyle: {
                '3d': 'preserve-3d',
            },
            backfaceVisibility: {
                'hidden': 'hidden',
            },
            perspective: {
                '1000': '1000px',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
        require("tailwindcss-animate"),
    ],
}
