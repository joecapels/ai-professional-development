import { useState } from "react";
import { Badge as UIBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SparkleProps {
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}

const Sparkle = ({ color = "#FFC700", size = 4, style }: SparkleProps) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
    initial={{ scale: 0, rotate: 0 }}
    animate={{
      scale: [0, 1, 0],
      rotate: [0, 90, 180],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 1,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: Math.random() * 0.5,
    }}
  >
    <path
      d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
      fill={color}
    />
  </motion.svg>
);

interface AnimatedBadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  isEarned?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AnimatedBadge({ 
  variant = "default", 
  isEarned = false, 
  className,
  children 
}: AnimatedBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sparklePositions = [
    { top: '-10%', left: '20%' },
    { top: '40%', left: '-10%' },
    { top: '40%', right: '-10%' },
    { top: '90%', left: '20%' },
    { top: '90%', right: '20%' },
  ];

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <UIBadge 
        variant={variant}
        className={cn(
          "transition-all duration-300 ease-in-out",
          isHovered && "scale-110 shadow-lg",
          isEarned && "bg-primary",
          className
        )}
      >
        {children}
      </UIBadge>

      <AnimatePresence>
        {isHovered && isEarned && sparklePositions.map((position, index) => (
          <motion.div
            key={index}
            className="absolute pointer-events-none"
            style={position}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Sparkle 
              size={8 + Math.random() * 8}
              color={variant === "default" ? "#FFC700" : "#FFE55C"}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
