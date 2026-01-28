import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Input({ label, labelRight, error, className = "", type, ...props }) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-white/60 uppercase tracking-widest pl-1">
                        {label}
                    </label>
                    {labelRight}
                </div>
            )}
            <div className="relative">
                <input
                    type={isPassword ? (showPassword ? "text" : "password") : type}
                    className={`w-full bg-[#050505] border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/5 transition-all outline-none ${isPassword ? 'pr-12' : ''}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
        </div>
    );
}
