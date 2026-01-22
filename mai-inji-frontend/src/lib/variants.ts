import { Variants } from 'framer-motion';
import { EASE, DURATION, STAGGER } from './animation';

export const buttonHover: Variants = {
    hover: {
        scale: 1.05,
        transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    tap: { scale: 0.95 }
};

export const fadeOnly: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { ease: EASE, duration: DURATION.normal }
    },
};

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { ease: EASE, duration: DURATION.normal }
    },
};

export const fadeInUpSlow: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { ease: EASE, duration: DURATION.slow }
    },
};

export const containerStagger: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: STAGGER.normal,
        },
    },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { ease: EASE, duration: DURATION.normal }
    },
};

export const slideInRight: Variants = {
    hidden: { x: 20, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { ease: EASE, duration: DURATION.normal }
    }
};

// Header Variants
export const headerVariant: Variants = {
    top: { y: 0, backgroundColor: 'rgba(255, 255, 255, 0)', borderBottomColor: 'rgba(255, 255, 255, 0)', height: '6rem' },
    scrolled: {
        y: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        height: '4rem',
        transition: { ease: EASE, duration: DURATION.normal }
    }
};

export const logoVariant: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { ease: EASE, duration: DURATION.normal } }
};

// Hero Variants
export const heroTextVariant: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { ease: EASE, duration: DURATION.slow, delay: 0.2 }
    }
};

export const ctaPulseVariant: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.05, 1],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
};

// Menu Card Variants
export const menuCardContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

export const menuCardVariant: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { ease: EASE, duration: DURATION.normal }
    },
    hover: { y: -5, boxShadow: "0px 10px 30px rgba(0,0,0,0.1)" },
    tap: { scale: 0.98 }
};

export const menuItemHover: Variants = {
    hover: { y: -2, transition: { ease: EASE, duration: 0.2 } }
};

// About Section Variants
export const aboutImageVariant: Variants = {
    hidden: { opacity: 0, x: -50, rotate: -2 },
    visible: {
        opacity: 1,
        x: 0,
        rotate: 0,
        transition: { ease: EASE, duration: DURATION.slow }
    }
};

export const aboutTextVariant: Variants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { ease: EASE, duration: DURATION.slow, delay: 0.2 }
    }
};

export const secondaryLogoVariant: Variants = {
    animate: {
        rotate: 360,
        transition: {
            duration: 120,
            repeat: Infinity,
            ease: "linear"
        }
    }
};
