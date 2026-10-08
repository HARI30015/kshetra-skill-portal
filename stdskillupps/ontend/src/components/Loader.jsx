import React from 'react';
import { motion } from 'framer-motion';

export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5">
      <div className="relative h-16 w-16">
        <motion.div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-violet-500 border-r-cyan-400"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-fuchsia-500 border-l-violet-400"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
        />
      </div>
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="text-sm font-medium text-slate-300"
      >
        {label}
      </motion.p>
    </div>
  );
}
