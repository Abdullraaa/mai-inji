"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from 'next/link';
import { m } from "framer-motion";
import toast from "react-hot-toast";
import Button from "./ui/Button";
import { FLYER_HERO, ABOUT_GIF, LOGO_COLLECTION, LOGO_SKEWERS } from "../../lib/assets";
import { menuService } from "@/services/menuService";
import { MenuItem } from "@/types/api";
import { useCart } from "@/store/cartStore";
import {
    heroTextVariant,
    ctaPulseVariant,
    menuCardContainer,
    menuCardVariant,
    menuItemHover,
    aboutImageVariant,
    aboutTextVariant,
    fadeInUp
} from "../../lib/variants";

export default function HomeClient() {
    const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
    const addItem = useCart(state => state.addItem);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                // In soft launch, this fetches the static mock data immediately
                const allItems = await menuService.getMenu();
                // Display all items on the homepage selection.
                // Keep placeholder handling for items without images (rendered below).
                setFeaturedItems(allItems);
            } catch (error) {
                console.error("Failed to load featured items", error);
            }
        };
        fetchFeatured();
    }, []);

    const handleAddToCart = (item: MenuItem) => {
        addItem(item, 1);
        toast.success(`Added ${item.name} to cart`, {
            icon: '🛒',
            duration: 3000,
            style: {
                background: '#fff',
                color: '#333',
                border: '1px solid #eee',
            }
        });
    };

    const handleSubscribe = () => {
        toast.success("Welcome to the Collective ✨", {
            duration: 4000,
            style: {
                background: '#9e2718', // Burgundy
                color: '#fff',
            },
            iconTheme: {
                primary: '#fff',
                secondary: '#9e2718',
            },
        });
    };

    return (
        <main className="min-h-screen bg-[#fafafa] dark:bg-gray-950">
            {/* Hero Section - Celebratory GIF */}
            <section className="relative w-full h-[85vh] overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={FLYER_HERO}
                        alt="Mai Inji Culinary Experience"
                        fill
                        className="object-cover scale-105"
                        unoptimized={true} // Priority GIF should not be optimized
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center items-start">
                    <div className="glass p-10 md:p-14 max-w-4xl border-white/10 bg-black/20 backdrop-blur-xl">
                        <m.span
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="text-white bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-1 text-xs font-bold tracking-[0.2em] uppercase rounded-full mb-6 inline-block"
                        >
                            Now Serving Lafia
                        </m.span>
                        <m.h1
                            variants={heroTextVariant}
                            initial="hidden"
                            animate="visible"
                            className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cream to-white text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight max-w-4xl"
                        >
                            FLAVOR THAT <span className="text-orange">FEELS LIKE</span> HOME.
                        </m.h1>
                        <m.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="text-xl text-gray-200 mb-10 max-w-2xl leading-relaxed"
                        >
                            Experience the intersection of Afro-fusion spices and artisan fast food shortcuts. We don't just feed you; we tell a story.
                        </m.p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="/menu">
                                <m.div
                                    variants={ctaPulseVariant}
                                    initial="initial"
                                    animate="animate"
                                >
                                    <Button variant="primary" size="lg">Order Now</Button>
                                </m.div>
                            </Link>
                            <Link href="/about">
                                <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-md">
                                    Our Story
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission / Vision — Brand Philosophy */}
            <section className="py-16 container mx-auto px-6">
                <div className="glass rounded-[2rem] p-10 max-w-4xl mx-auto text-center">
                    <h4 className="text-sm font-black uppercase tracking-[0.4em] text-green-600 mb-4">Our Promise</h4>
                    <p className="text-lg text-gray-700 dark:text-gray-200 mb-6 font-medium">Food as comfort — northern hospitality, street flavors, and careful craft in every bite.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                        <div>
                            <h5 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2">Mission</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Serve familiar flavors with care, so every meal feels like coming home.</p>
                        </div>
                        <div>
                            <h5 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2">Vision</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Elevate street-born recipes into thoughtful, modern plates.</p>
                        </div>
                        <div>
                            <h5 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2">Promise</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Hospitality first — we craft, not rush, and we feed with warmth.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Brand Marquee using secondary logos */}
            <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-hidden relative">
                <div className="flex animate-scroll whitespace-nowrap items-center will-change-transform">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-16 items-center px-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                            <Image src={LOGO_COLLECTION} alt="Collection" width={80} height={30} className="object-contain" />
                            <Image src={LOGO_SKEWERS} alt="Skewers" width={80} height={30} className="object-contain" />
                            <span className="text-2xl font-black tracking-tighter text-gray-300">MAI INJI</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Modern Menu Grid */}
            <section className="py-24 container mx-auto px-6" id="menu">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
                    <div>
                        <m.h2
                            initial="hidden"
                            whileInView="visible"
                            variants={fadeInUp}
                            className="text-sm font-bold tracking-[0.3em] uppercase text-green-600 mb-4"
                        >
                            The Selection
                        </m.h2>
                        <m.h3
                            initial="hidden"
                            whileInView="visible"
                            variants={fadeInUp}
                            className="text-5xl font-black text-gray-900 dark:text-white tracking-tight"
                        >
                            CRAFTED FOR YOUR <br /> CRAVINGS
                        </m.h3>
                    </div>
                    <Link href="/menu" className="group flex items-center gap-2 text-burgundy font-black uppercase tracking-widest text-xs hover:text-orange transition-colors">
                        View Full Menu
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>

                <m.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    variants={menuCardContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                >
                    {featuredItems.map((item) => (
                        <m.div
                            key={item.id}
                            variants={menuCardVariant}
                            whileHover="hover"
                            whileTap="tap"
                            className="group glass p-0 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden flex flex-col h-full"
                        >
                            {/* Image Area */}
                            <div className="h-48 relative overflow-hidden bg-gray-100">
                                {item.image_url ? (
                                    <Image
                                        src={item.image_url}
                                        alt={item.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        sizes="(max-width: 768px) 100vw, 25vw"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                        <Image
                                            src="/menu/placeholder.svg"
                                            alt="Placeholder"
                                            fill
                                            className="object-contain opacity-70"
                                        />
                                    </div>
                                )}
                                {item.label && (
                                    <div className="absolute top-4 left-4 z-10">
                                        <span className="px-3 py-1 bg-white/80 backdrop-blur-md text-[10px] font-black uppercase tracking-wide text-gray-900 rounded-full shadow-sm">
                                            {item.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <m.div variants={menuItemHover} className="p-6 flex flex-col flex-1">
                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none uppercase">{item.name}</h3>
                                    <span className="text-lg font-black italic text-burgundy">{item.price_formatted}</span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mb-6 flex-grow line-clamp-3">
                                    {item.description}
                                </p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full bg-gray-50 dark:bg-gray-800 hover:bg-gradient-to-r hover:from-burgundy hover:to-orange hover:text-white shadow-none border-none py-3"
                                    onClick={() => handleAddToCart(item)}
                                >
                                    Add to Cart
                                </Button>
                            </m.div>
                        </m.div>
                    ))}
                </m.div>
                <p className="mt-12 text-center text-xs text-gray-400 italic">
                    * All descriptions and prices are just placeholders for visual demonstration.
                </p>
            </section>

            {/* Enhanced Story Section with GIF */}
            <section className="py-24 bg-linear-to-br from-burgundy to-orange relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-black/10 skew-x-12 translate-x-1/2 pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2 group">
                            <m.div
                                variants={aboutImageVariant}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="relative overflow-hidden rounded-[3rem] shadow-2xl"
                            >
                                <Image
                                    src={ABOUT_GIF}
                                    alt="The Mai Inji Spirit"
                                    width={600}
                                    height={800}
                                    className="w-full h-auto"
                                    unoptimized={true}
                                />
                                <div className="absolute inset-0 bg-green-600/10 mix-blend-overlay" />
                            </m.div>
                        </div>
                        <m.div
                            className="md:w-1/2"
                            variants={aboutTextVariant}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <h2 className="text-white/60 font-bold tracking-[0.4em] uppercase text-xs mb-6">Our Legacy</h2>
                            <h3 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none italic uppercase">THE SOUL OF THE GRILL</h3>
                            <p className="text-xl text-green-50/80 leading-relaxed mb-12 font-medium">
                                Mai Inji isn't just a kitchen; it's a movement. We believe that fast food should be crafted with the same patience and soul as a Sunday feast. Born from a desire to celebrate local tradition through a modern lens, every skewer and spice blend is a tribute to our heritage.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                                <div>
                                    <h4 className="text-white font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-3">
                                        <span className="w-2 h-2 bg-white rounded-full" />
                                        Artisan Spirit
                                    </h4>
                                    <p className="text-white/60 text-sm leading-relaxed">Every ingredient is sourced with integrity and prepared with precision.</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-3">
                                        <span className="w-2 h-2 bg-white rounded-full" />
                                        Urban Roots
                                    </h4>
                                    <p className="text-white/60 text-sm leading-relaxed">Modern aesthetics meet traditional soul in every corner of our craft.</p>
                                </div>
                            </div>
                        </m.div>
                    </div>
                </div>

                {/* Decorative Watermark */}
                <div className="absolute -bottom-24 -left-24 opacity-5 pointer-events-none select-none">
                    <span className="text-[20rem] font-black text-white leading-none">AFRO</span>
                </div>
            </section>

            {/* Newsletter / Loyalty Scaffold */}
            <section className="py-24 container mx-auto px-6">
                <div className="glass rounded-[3rem] p-12 md:p-24 bg-black/5 dark:bg-white/5 relative overflow-hidden text-center">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-sm font-black uppercase tracking-[0.4em] text-green-600 mb-6">Join the Collective</h2>
                        <h3 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">NEVER MISS A FLAVOR.</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-12 text-lg font-medium">Be the first to know about exclusive drops, secret menu items, and the Mai Inji loyalty experience.</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="email"
                                placeholder="ENTER YOUR EMAIL"
                                className="flex-1 px-8 py-5 bg-white dark:bg-gray-950 rounded-2xl border-none focus:ring-2 focus:ring-green-600 font-bold uppercase text-xs tracking-widest outline-none"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                className="hover:bg-green-700 shadow-xl shadow-green-600/20"
                                onClick={handleSubscribe}
                            >
                                SUBSCRIBE
                            </Button>
                        </div>
                    </div>
                    {/* Background Accent */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-600 to-transparent opacity-50" />
                </div>
            </section>
        </main>
    );
}

