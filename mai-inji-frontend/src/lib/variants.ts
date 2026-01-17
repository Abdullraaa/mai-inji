// src/lib/variants.ts
// Centralized Framer Motion variants for Mai Inji
import { organicEasing, timings } from "@/lib/animation";
import { Variants } from "framer-motion";

/** Primary logo entrance (home only) */
export const logoVariant: Variants = {
    hidden: { opacity: 0, y: 12, scale: 0.96 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { delay: 0.2, duration: timings.hero, ease: organicEasing },
    },
};

/** Secondary logos – slow ambient motion */
export const secondaryLogoVariant: Variants = {
    animate: {
        rotate: [0, 360],
        opacity: [0.04, 0.06],
        transition: { repeat: Infinity, duration: 50, ease: "linear" },
    },
};

/** Hero text staggered after logo */
export const heroTextVariant: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { delay: 0.4, duration: timings.section, ease: organicEasing },
    },
};

/** CTA pulse on initial load */
export const ctaPulseVariant: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.04, 1],
        transition: { duration: 0.3, ease: organicEasing },
    },
};

/** Menu card container for stagger */
export const menuCardContainer: Variants = {
    visible: { transition: { staggerChildren: 0.08 } },
};
export const menuCardVariant: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: timings.micro, ease: organicEasing },
    },
};

/** About section image & text */
export const aboutImageVariant: Variants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
        opacity: 1,
        scale: 1,
        boxShadow: "0 0 20px rgba(255,255,255,0.2)",
        transition: { duration: timings.section, ease: organicEasing },
    },
};
export const aboutTextVariant: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: timings.section, ease: organicEasing },
    },
};

/** Menu item hover / tap */
export const menuItemHover: Variants = {
    hover: {
        y: -6,
        scale: 1.03,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        transition: { duration: timings.micro, ease: organicEasing },
    },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
};

/** Header scroll states */
export const headerVariant: Variants = {
    top: { height: "4rem", background: "rgba(255,255,255,0)", boxShadow: "none" },
    scrolled: {
        height: "3rem",
        background: "rgba(255,255,255,0.9)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        transition: { duration: 0.2, ease: organicEasing },
    },
};

/** Standard button hover */
export const buttonHover: Variants = {
    hover: {
        backgroundColor: "var(--color-primary)",
        x: 3,
        transition: { duration: 0.14, ease: organicEasing },
    },
};

/** Primary CTA shimmer (once) */
export const primaryCtaShimmer: Variants = {
    initial: { backgroundPosition: "-200% 0" },
    animate: {
        backgroundPosition: ["-200% 0", "200% 0"],
        transition: { duration: 1.2, ease: organicEasing },
    },
};

/** Cart add fly‑to‑icon */
export const addToCartFly: Variants = {
    hidden: { opacity: 0, scale: 0.5, x: 0, y: 0 },
    visible: {
        opacity: 1,
        scale: 1,
        x: 120,
        y: -80,
        transition: { duration: 0.4, ease: organicEasing },
    },
};

/** Global loading steam lines */
export const steamLineVariant: Variants = {
    animate: {
        y: [0, -10, 0],
        opacity: [0.4, 0.8, 0.4],
        transition: { repeat: Infinity, duration: 1.5, ease: organicEasing },
    },
};

/** Empty‑state text */
export const emptyTextVariant: Variants = {
    hidden: { opacity: 0, letterSpacing: "0.5em" },
    visible: {
        opacity: 1,
        letterSpacing: "0em",
        transition: { duration: timings.section, ease: organicEasing },
    },
};
