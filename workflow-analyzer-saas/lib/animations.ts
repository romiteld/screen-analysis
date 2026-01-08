import { Variants, Transition } from "framer-motion"

// === TRANSITION PRESETS ===

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
}

export const smoothTransition: Transition = {
  type: "tween",
  ease: [0.4, 0, 0.2, 1],
  duration: 0.5,
}

export const bounceTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
}

export const gentleTransition: Transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.6,
}

// === ENTRANCE ANIMATIONS ===

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: smoothTransition,
  },
}

export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: gentleTransition,
  },
}

export const fadeDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: gentleTransition,
  },
}

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
}

export const scaleUp: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: bounceTransition,
  },
}

export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -30
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: gentleTransition,
  },
}

export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 30
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: gentleTransition,
  },
}

export const blurIn: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(10px)"
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
}

// === CONTAINER ANIMATIONS ===

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

// === HOVER ANIMATIONS ===

export const hoverScale = {
  scale: 1.02,
  transition: springTransition,
}

export const hoverScaleLarge = {
  scale: 1.05,
  transition: springTransition,
}

export const hoverLift = {
  y: -4,
  transition: springTransition,
}

export const hoverGlow = {
  boxShadow: "0 0 30px -5px hsl(var(--primary) / 0.4)",
  transition: smoothTransition,
}

// === TAP ANIMATIONS ===

export const tapScale = {
  scale: 0.98,
}

export const tapScaleSmall = {
  scale: 0.95,
}

// === PAGE TRANSITIONS ===

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1],
    },
  },
}

export const slidePageLeft: Variants = {
  initial: {
    opacity: 0,
    x: 100
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: gentleTransition,
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: {
      duration: 0.3,
    },
  },
}

export const slidePageRight: Variants = {
  initial: {
    opacity: 0,
    x: -100
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: gentleTransition,
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: 0.3,
    },
  },
}

// === MODAL ANIMATIONS ===

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
}

export const slideUp: Variants = {
  hidden: {
    opacity: 0,
    y: "100%"
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    y: "100%",
    transition: { duration: 0.3 },
  },
}

// === DRAWER ANIMATIONS ===

export const drawerLeft: Variants = {
  hidden: {
    x: "-100%",
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: { duration: 0.3 },
  },
}

export const drawerRight: Variants = {
  hidden: {
    x: "100%",
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.3 },
  },
}

// === LIST ITEM ANIMATIONS ===

export const listItem: Variants = {
  hidden: {
    opacity: 0,
    x: -10
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: smoothTransition,
  },
}

export const listItemFromRight: Variants = {
  hidden: {
    opacity: 0,
    x: 10
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: smoothTransition,
  },
}

// === CARD ANIMATIONS ===

export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    transition: springTransition,
  },
}

export const cardReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
}

// === FLOATING ANIMATIONS ===

export const float: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export const floatSlow: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export const rotate: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

export const pulse: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

// === SCROLL REVEAL ===

export const scrollReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

export const scrollRevealLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

export const scrollRevealRight: Variants = {
  hidden: {
    opacity: 0,
    x: 50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

// === UTILITY FUNCTIONS ===

export const getStaggerDelay = (index: number, baseDelay: number = 0.1): number => {
  return index * baseDelay
}

export const createStaggerVariants = (staggerDelay: number = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
    },
  },
})

export const createDelayedVariant = (
  variant: Variants,
  delay: number
): Variants => ({
  ...variant,
  visible: {
    ...variant.visible,
    transition: {
      ...(typeof variant.visible === 'object' && 'transition' in variant.visible
        ? variant.visible.transition
        : {}),
      delay,
    },
  },
})
