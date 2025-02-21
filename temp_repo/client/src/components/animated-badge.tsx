import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBadgeProps {
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  progress?: {
    current: number;
    target: number;
  };
  earned?: boolean;
}

const rarityColors = {
  common: "from-slate-400/20 to-slate-500/20 hover:from-slate-400/30 hover:to-slate-500/30",
  uncommon: "from-green-400/20 to-green-500/20 hover:from-green-400/30 hover:to-green-500/30",
  rare: "from-blue-400/20 to-blue-500/20 hover:from-blue-400/30 hover:to-blue-500/30",
  epic: "from-purple-400/20 to-purple-500/20 hover:from-purple-400/30 hover:to-purple-500/30",
  legendary: "from-yellow-400/20 to-yellow-500/20 hover:from-yellow-400/30 hover:to-yellow-500/30"
};

const Sparkle = ({ style }: { style: React.CSSProperties }) => (
  <motion.div
    style={style}
    className="absolute w-1 h-1 bg-white rounded-full"
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 1,
      repeat: Infinity,
      repeatDelay: Math.random() * 2,
    }}
  />
);

export function AnimatedBadge({
  name,
  description,
  imageUrl,
  rarity = "common",
  progress,
  earned,
}: AnimatedBadgeProps) {
  const sparkles = Array.from({ length: 5 }).map((_, i) => ({
    style: {
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
    },
  }));

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative p-6 rounded-lg bg-gradient-to-br transition-colors duration-300",
        rarityColors[rarity as keyof typeof rarityColors],
        !earned && "opacity-50 grayscale"
      )}
    >
      {earned && sparkles.map((sparkle, i) => (
        <Sparkle key={i} style={sparkle.style} />
      ))}
      
      <div className="relative z-10">
        <motion.div
          initial={{ rotateY: 0 }}
          whileHover={{ rotateY: 180 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <div className="w-24 h-24 mb-4">
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="text-lg font-bold mb-2">{name}</h3>
          <p className="text-sm text-center text-muted-foreground">{description}</p>
          
          {progress && (
            <div className="w-full mt-4">
              <div className="w-full bg-background/50 rounded-full h-2">
                <motion.div
                  className="bg-primary h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current / progress.target) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-center mt-2 text-muted-foreground">
                {progress.current} / {progress.target}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
