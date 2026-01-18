// Centralized asset registry for Mai Inji Branding
// Authority: Phase Z Asset Refactor

/** Brand Identity */
export const LOGO_PRIMARY = "/brand/logo/primary.png";
export const LOGO_SECONDARY = "/brand/logo/logo-secondary.png";
export const LOGO_TRIAD = "/brand/logo/logo-triad.png";
export const LOGO_WORDMARK = "/brand/logo/logo-wordmark.png";
export const LOGO_BURRITO = "/brand/logo/logo-burrito.png";
export const LOGO_SKEWERS = "/brand/logo/logo-skewers.png";
export const LOGO_COLLECTION = "/brand/logo/logo-collection.png";

export const LOGOS_ALT = [
    LOGO_BURRITO,
    LOGO_SKEWERS,
    LOGO_TRIAD,
    LOGO_WORDMARK,
    LOGO_COLLECTION,
    LOGO_SECONDARY
];

/** Campaign Flyers & Motion */
export const FLYER_HERO = "/brand/flyers/hero-1.gif";
export const FLYER_ABOUT = "/brand/flyers/about-story.gif";

/** Menu Items (Digital Plating) */
export const MENU_SHAWARMA = "/menu/shawarma.png";
export const MENU_BURGER = "/menu/burger.png";
export const MENU_ZOBO = "/menu/zobo.png";
export const MENU_TIGERNUT = "/menu/zobo.png"; // Placeholder
export const MENU_YOGHURT = "/menu/yoghurt.png";
export const MENU_ARABIAN_TEA = "/menu/zobo.png"; // Placeholder
export const MENU_MASA = "/menu/masa.png";
export const MENU_SUYA = "/menu/suya.png";
export const MENU_BOBA = "/menu/boba-tea.png";
export const MENU_PIZZA = "/menu/pizza.png";

export const MENU_ITEMS = {
    Shawarma: MENU_SHAWARMA,
    Burger: MENU_BURGER,
    Zobo: MENU_ZOBO,
    Tigernut: MENU_TIGERNUT,
    Yoghurt: MENU_YOGHURT,
    "Arabian Tea": MENU_ARABIAN_TEA,
    Masa: MENU_MASA,
    Suya: MENU_SUYA,
    "Boba Tea": MENU_BOBA,
    Pizza: MENU_PIZZA
};

// Legacy alias compatibility (Deprecate in Phase Z4)
export const MAIN_LOGO = LOGO_PRIMARY;
export const MAIN_FLYER = FLYER_HERO;
export const ABOUT_GIF = FLYER_ABOUT;
