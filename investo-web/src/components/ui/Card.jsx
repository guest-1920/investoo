import React from 'react';
import { motion } from 'framer-motion';

export function Card({ children, className = "", hover = false }) {
    // Base style matches homepage: Extremely dark background (close to #050505) with subtle border
    return (
        <motion.div
            whileHover={hover ? { y: -5 } : {}}
            className={`bg-[#0A0A0A]/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl ${className}`}
        >
            {children}
        </motion.div>
    );
}
