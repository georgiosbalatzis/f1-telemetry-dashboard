/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'ferrari': '#DC0000',
                'mercedes': '#00D2BE',
                'redbull': '#0600EF',
                'mclaren': '#FF8700',
                'sauber': '#469BFF',
                'alpine': '#0090FF',
                'aston': '#006F62',
                'haas': '#FFFFFF',
                'rb': '#CAD2D3',
                'williams': '#005AFF'
            },
        },
    },
    plugins: [],
}