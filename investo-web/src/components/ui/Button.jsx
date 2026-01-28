import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
    children,
    variant = 'primary', // primary, secondary, outline, ghost
    isLoading = false,
    className = "",
    disabled,
    ...props
}) {
    const baseStyles = "relative font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    // Variants tailored to match homepage aesthetics
    const variants = {
        primary: "bg-white text-black hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] py-4 px-6 md:py-3 md:px-5",
        secondary: "bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] py-4 px-6 md:py-3 md:px-5",
        outline: "bg-transparent border border-white/20 text-white hover:bg-white/5 py-4 px-6 md:py-3 md:px-5",
        ghost: "bg-transparent text-white/60 hover:text-white py-2 px-4 hover:bg-white/5",
        icon: "p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
            {children}
        </button>
    );
}
