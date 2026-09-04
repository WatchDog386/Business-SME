import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

export function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-surface px-6 py-12"
    >
      {/* Background image — dark blue overshadow so image is a bit invisible */}
      <img
        src="https://i.pinimg.com/1200x/7b/04/96/7b0496379acaeae6d57360c2fbde9ebe.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[#062654]/60" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-[#062654]/35 via-[#062654]/20 to-[#062654]/45" aria-hidden />

      <div className="relative z-10 flex-1" />

      <div className="relative z-10 mt-12 mb-6 flex flex-col items-center">
        <img
          src={logo}
          alt="Biashara logo"
          className="relative h-44 w-44 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        />
        <h1 className="mt-3 text-4xl font-normal tracking-wide text-[#39B54A] drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
          OmniTrack
        </h1>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-end pb-12">
        <style>{`@keyframes dotScale { 0%, 80%, 100% { transform: scale(0.75); opacity: 0.45; } 40% { transform: scale(1); opacity: 1; } }`}</style>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#39B54A] shadow-[0_0_8px_rgba(57,181,74,0.6)]" style={{ animation: 'dotScale 1s 0s infinite' }} />
            <span className="h-2.5 w-2.5 rounded-full bg-white shadow-sm" style={{ animation: 'dotScale 1s 0.2s infinite' }} />
            <span className="h-2.5 w-2.5 rounded-full bg-[#4CAF50] shadow-[0_0_8px_rgba(76,175,80,0.6)]" style={{ animation: 'dotScale 1s 0.4s infinite' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
