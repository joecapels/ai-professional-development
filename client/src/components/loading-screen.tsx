import { motion } from "framer-motion";

const CareerIllustration = () => (
  <svg
    width="240"
    height="240"
    viewBox="0 0 240 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-primary"
  >
    {/* Career Growth Path */}
    <motion.path
      d="M40 200 L100 140 L140 160 L200 40"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, ease: "easeInOut" }}
    />

    {/* Circular Milestone Points */}
    <motion.g
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <circle cx="40" cy="200" r="8" fill="currentColor" />
      <circle cx="100" cy="140" r="8" fill="currentColor" />
      <circle cx="140" cy="160" r="8" fill="currentColor" />
      <circle cx="200" cy="40" r="8" fill="currentColor" />
    </motion.g>

    {/* Professional Icons */}
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
    >
      {/* Briefcase */}
      <path
        d="M90 130 h60 v40 h-60 v-40 M110 130 v-10 h20 v10"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
      />
      {/* Graduation Cap */}
      <path
        d="M180 30 l20 10 l-20 10 l-20 -10 z"
        stroke="currentColor"
        fill="currentColor"
      />
    </motion.g>
  </svg>
);

export function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center space-y-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CareerIllustration />
        </motion.div>
        <motion.h1
          className="text-2xl font-bold text-foreground"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Loading your professional journey...
        </motion.h1>
        <motion.div
          className="w-48 h-1 bg-primary/20 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}