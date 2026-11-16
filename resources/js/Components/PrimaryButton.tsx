import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-full border border-transparent bg-[#2D60FF] px-6 py-3 text-xs font-bold text-white transition duration-150 ease-in-out hover:bg-[#204FDE] focus:bg-[#204FDE] focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-sm active:scale-[0.98] ${
                    disabled && 'opacity-35 pointer-events-none'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
