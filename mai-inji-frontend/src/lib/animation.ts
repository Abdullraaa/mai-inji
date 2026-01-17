// src/lib/animation.ts
// Centralized animation constants for Mai Inji
import { Easing } from "framer-motion";

export const organicEasing: Easing = [0.16, 1, 0.3, 1];
export const timings = {
    micro: 0.12, // 120 ms
    microMax: 0.18, // 180 ms
    section: 0.45, // 400‑600 ms average
    hero: 0.8, // 800 ms for logo entrance
};
