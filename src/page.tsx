
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icons from '@/components/icons';
import { motion } from 'framer-motion';
import { useUser } from '@/firebase';

export default function SplashScreen() {
  const router = useRouter();
  const { user, status } = useUser();

  useEffect(() => {
    if (status === 'loading') {
      return; // Wait until user status is determined
    }
    
    const timer = setTimeout(() => {
      if (user) {
        router.push('/planner');
      } else {
        router.push('/login');
      }
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer);
  }, [router, user, status]);

  const planeVariants = {
    hidden: { x: '-150%', y: '50%', rotate: -20 },
    visible: { 
      x: '150%', 
      y: '-50%',
      rotate: 20,
      transition: { duration: 1.5, ease: 'easeInOut' }
    },
  };
  
  const textVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { delay: 1, duration: 1 } },
  }

  return (
    <div className="flex h-svh w-full flex-col items-center justify-center bg-background text-primary overflow-hidden">
      <motion.div 
        className="absolute"
        variants={planeVariants}
        initial="hidden"
        animate="visible"
      >
        <Icons.Plane className="w-24 h-24 text-primary/80" />
      </motion.div>
      <motion.div
        variants={textVariants}
        initial="hidden"
        animate="visible"
        className="z-10 text-center"
      >
        <div className="flex items-center gap-2 justify-center">
            <Icons.Compass className="h-12 w-12" />
            <h1 className="text-6xl font-bold font-headline tracking-tight">
                epiqway
            </h1>
        </div>
        <p className="mt-2 text-lg text-muted-foreground">Your smart travel itinerary planner</p>
      </motion.div>
    </div>
  );
}
