"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const pathname = usePathname();

  const variants = {
    hidden: { opacity: 0 }, // Start fully transparent
    enter: {
      opacity: 1,
      transition: { type: "easeIn", duration: 0.5 }, // Ease-in for appearing
    },
    exit: {
      opacity: 0,
      transition: { type: "easeOut", duration: 0.3 }, // Faster ease-out for disappearing
    },
  };

  return (
    <AnimatePresence mode="wait">
      {" "}
      {/* wait ensures exit animation completes before enter */}
      <motion.div
        key={pathname} // Key change triggers animation
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit" // Use the exit variant defined above
        className="h-full w-full" // Ensure motion div takes space
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
