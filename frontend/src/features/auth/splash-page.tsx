import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import logo from '@/assets/logo.png';
import { Smartphone, Play } from 'lucide-react';

export function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3500);
    return () => clearTimeout(timer);
  }, [navigate]);

  // Animation configurations with 'as const' for strict types
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring" as const, stiffness: 300, damping: 24 } 
    }
  };

  const logoVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0, rotate: -5 },
    show: { 
      scale: 1, 
      opacity: 1, 
      rotate: 0,
      transition: { type: "spring" as const, stiffness: 200, damping: 20 }
    }
  };

  return (
    <div
      onClick={() => navigate('/login')}
      className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-[#0A1128] px-6 py-12 text-white cursor-pointer select-none"
    >
      {/* High-Contrast Gradient Background with Radial Center */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#29B6F6]/40 via-[#1976D2]/60 to-[#0D47A1]" />
      <div className="absolute top-0 left-0 w-full h-full z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.2; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .dot-pulse-1 { animation: dotPulse 1.2s infinite ease-in-out 0s; }
        .dot-pulse-2 { animation: dotPulse 1.2s infinite ease-in-out 0.15s; }
        .dot-pulse-3 { animation: dotPulse 1.2s infinite ease-in-out 0.3s; }
        .dot-pulse-4 { animation: dotPulse 1.2s infinite ease-in-out 0.45s; }
        .dot-pulse-5 { animation: dotPulse 1.2s infinite ease-in-out 0.6s; }
        .dot-pulse-6 { animation: dotPulse 1.2s infinite ease-in-out 0.75s; }
        .dot-pulse-7 { animation: dotPulse 1.2s infinite ease-in-out 0.9s; }
        .dot-pulse-8 { animation: dotPulse 1.2s infinite ease-in-out 1.05s; }
      `}</style>

      <div className="flex-1 z-10" />

      {/* Center Content: Animated Logo and Branding */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center"
      >
        <motion.div 
          variants={logoVariants}
          className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white/5 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl border border-white/10"
        >
          <img
            src={logo}
            alt="OmniTrack Logo"
            className="h-full w-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
          />
        </motion.div>

        <motion.h1 
          variants={itemVariants}
          className="mt-8 text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 drop-shadow-md font-sans"
        >
          OmniTrack
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="mt-3 text-xs font-bold tracking-[0.2em] text-[#29B6F6] uppercase drop-shadow-sm"
        >
          Smart SME Solutions
        </motion.p>
      </motion.div>

      <div className="flex-1 z-10" />

      {/* Bottom Content: Fades in smoothly after logo */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="relative z-10 flex flex-col items-center space-y-4 pb-4"
      >
        {/* Perfect Circle Static Dotted Spinner */}
        <div className="relative h-6 w-6">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <span
              key={deg}
              className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 -ml-[3px] -mt-[3px] rounded-full bg-white dot-pulse-${i + 1}`}
              style={{
                transform: `rotate(${deg}deg) translate(0, -10px)`,
              }}
            />
          ))}
        </div>

        <span className="text-xs font-medium text-white/85 tracking-wider">
          Loading...
        </span>

        {/* Platform Icons (Android & Play Store) */}
        <div className="flex items-center gap-4 pt-2 text-white/80">
          <Smartphone className="h-5 w-5" />
          <Play className="h-4 w-4 fill-white/80" />
        </div>
      </motion.div>
    </div>
  );
}
