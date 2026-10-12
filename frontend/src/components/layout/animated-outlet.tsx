import { useEffect } from 'react';
import { useLocation, useNavigationType, useOutlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useIsDesktop } from '@/hooks/use-is-desktop';

/**
 * Route content with an app-style entrance: on phones new screens slide in
 * from the right (or the left when going back); desktop just fades.
 */
export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();
  const navigationType = useNavigationType();
  const isDesktop = useIsDesktop();
  const back = navigationType === 'POP';

  // New screens start at the top, like a native app
  useEffect(() => {
    if (!back) window.scrollTo({ top: 0 });
  }, [location.pathname, back]);

  return (
    <motion.div
      key={location.pathname}
      initial={isDesktop ? { opacity: 0 } : { opacity: 0, x: back ? -28 : 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        isDesktop
          ? { duration: 0.18 }
          : { type: 'spring', stiffness: 420, damping: 38, mass: 0.8 }
      }
    >
      {outlet}
    </motion.div>
  );
}
