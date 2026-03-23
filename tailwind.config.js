import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            colors: {
                sapphire: {
                    50: '#e9f0fb',
                    100: '#d3e1f8',
                    200: '#a8c2f0',
                    300: '#7ca4e9',
                    400: '#5186e1',
                    500: '#2567da',
                    600: '#1e53ae',
                    700: '#163e83',
                    800: '#0f2957',
                    900: '#07152c',
                    950: '#050e1f',
                },
                white: {
                    50: '#ebfafa',
                    100: '#d6f5f5',
                    200: '#adebeb',
                    300: '#85e0e0',
                    400: '#5cd6d6',
                    500: '#33cccc',
                    600: '#29a3a3',
                    700: '#1f7a7a',
                    800: '#145252',
                    900: '#0a2929',
                    950: '#071d1d',
                },
                'powder-blue': {
                    50: '#edf3f7',
                    100: '#dbe6f0',
                    200: '#b8cde0',
                    300: '#94b5d1',
                    400: '#709cc2',
                    500: '#4d83b3',
                    600: '#3d698f',
                    700: '#2e4f6b',
                    800: '#1f3447',
                    900: '#0f1a24',
                    950: '#0b1219',
                },
                'bubblegum-pink': {
                    50: '#fce9eb',
                    100: '#f8d3d6',
                    200: '#f2a6ae',
                    300: '#eb7a85',
                    400: '#e44e5d',
                    500: '#de2134',
                    600: '#b11b2a',
                    700: '#85141f',
                    800: '#590d15',
                    900: '#2c070a',
                    950: '#1f0507',
                },
                black: {
                    50: '#ffe5e5',
                    100: '#ffcccc',
                    200: '#ff9999',
                    300: '#ff6666',
                    400: '#ff3333',
                    500: '#ff0000',
                    600: '#cc0000',
                    700: '#990000',
                    800: '#660000',
                    900: '#330000',
                    950: '#240000',
                },
            },
            fontFamily: {
                dashboard: ['"DM Sans"', ...defaultTheme.fontFamily.sans],
                mono: ['"DM Mono"', ...defaultTheme.fontFamily.mono],
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};
