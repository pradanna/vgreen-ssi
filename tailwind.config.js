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
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', ...defaultTheme.fontFamily.sans],
                mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                brand: {
                    50: '#EEF4FF',
                    100: '#E0EBFF',
                    200: '#C7D9FE',
                    300: '#A4BFFE',
                    400: '#7599FB',
                    500: '#4B73F7',
                    600: '#2D60FF', // Sinao Primary Blue
                    700: '#1D45D8',
                    800: '#1B3AA9',
                    900: '#1B3484',
                },
                accent: {
                    50: '#FFF7ED',
                    100: '#FFEDD5',
                    200: '#FED7AA',
                    300: '#FDBA74',
                    400: '#FB923C',
                    500: '#FF7A00', // Sinao Coral / Orange
                    600: '#EA580C',
                    700: '#C2410C',
                },
                canvas: {
                    DEFAULT: '#F7F9FC',
                    subtle: '#F1F4F9',
                    card: '#FFFFFF',
                },
            },
            boxShadow: {
                'card': '0 2px 12px 0 rgba(15, 23, 42, 0.03)',
                'card-hover': '0 8px 24px -4px rgba(15, 23, 42, 0.06)',
                'banner': '0 12px 32px -6px rgba(15, 23, 42, 0.08)',
                'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
            },
            borderRadius: {
                '2.5xl': '20px',
                '3xl': '24px',
            },
        },
    },

    plugins: [forms],
};
