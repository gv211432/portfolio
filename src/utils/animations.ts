// Shared animation presets for framer-motion
// Used across all domain pages for consistent animations

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6 },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 },
};

// For staggered children animations
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Viewport animation props (for whileInView)
export const viewportOnce = { once: true };

// Helper to create delayed animations
export const withDelay = (animation: typeof fadeInUp, delay: number) => ({
  ...animation,
  transition: { ...animation.transition, delay },
});

// Pulse animation for backgrounds
export const pulseAnimation = {
  animate: {
    opacity: [0.3, 0.6, 0.3],
    scale: [1, 1.1, 1],
  },
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

// Floating dots animation
export const floatingDot = (index: number) => ({
  animate: {
    opacity: [0.2, 0.8, 0.2],
    scale: [1, 1.5, 1],
  },
  transition: {
    duration: 3 + Math.random() * 2,
    repeat: Infinity,
    delay: index * 0.2,
  },
});
