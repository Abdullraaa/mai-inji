"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { LOGO_PRIMARY, LOGO_WORDMARK } from "../../lib/assets";
import { secondaryLogoVariant } from "../../lib/variants";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-gray-950 text-gray-800 py-24 border-t border-gray-100 dark:border-gray-900 relative overflow-hidden">
            {/* Ambient Rotating H2 Logo Accent */}
            <motion.div
                className="absolute -top-40 -right-40 w-[30rem] h-[30rem] pointer-events-none select-none z-0 opacity-5"
                variants={secondaryLogoVariant}
                animate="animate"
            >
                <Image
                    src={LOGO_PRIMARY}
                    alt=""
                    fill
                    className="object-contain grayscale"
                />
            </motion.div>
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <Image src={LOGO_PRIMARY} alt="Mai Inji brand mark" width={140} height={60} className="mb-8 opacity-90 hover:opacity-100 transition-all duration-500" />
                        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400 max-w-xs font-medium">
                            Experience the vibrant intersection of Afro-fusion flavors and artisan fast food at Mai Inji.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-black uppercase tracking-[0.2em] text-xs mb-8 text-burgundy">Explore</h4>
                        <ul className="space-y-6 text-sm font-bold tracking-wide text-gray-600 dark:text-gray-300">
                            <li><Link href="/menu" className="hover:text-orange transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-2 h-[1px] bg-orange transition-all"></span>Menu</Link></li>
                            <li><Link href="/about" className="hover:text-orange transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-2 h-[1px] bg-orange transition-all"></span>Our Story</Link></li>
                            <li><Link href="/franchise" className="hover:text-orange transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-2 h-[1px] bg-orange transition-all"></span>Franchise</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black uppercase tracking-[0.2em] text-xs mb-8 text-burgundy">Location</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                            Lafia, Nasarawa State<br />
                            Nigeria
                        </p>
                        <p className="mt-4 text-xs font-bold text-green-600 uppercase tracking-widest">Open Daily: 8AM - 10PM</p>
                    </div>

                    <div>
                        <h4 className="font-black uppercase tracking-[0.2em] text-xs mb-8 text-burgundy">Connect</h4>
                        <div className="flex space-x-4">
                            {/* Social Icons Placeholder */}
                            <a href="#" className="w-12 h-12 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center hover:bg-green-600 hover:text-white hover:border-green-600 transition-all shadow-lg shadow-green-600/10 group">
                                <span className="sr-only">Instagram</span>
                                <span className="group-hover:scale-110 transition-transform">📷</span>
                            </a>
                            <a href="#" className="w-12 h-12 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center hover:bg-green-600 hover:text-white hover:border-green-600 transition-all shadow-lg shadow-green-600/10 group">
                                <span className="sr-only">Twitter</span>
                                <span className="group-hover:scale-110 transition-transform">🐦</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] text-gray-400 tracking-widest uppercase font-bold">
                        © {new Date().getFullYear()} MAI INJI. CRAFTED FOR FLAVOR.
                    </p>
                    <Image src={LOGO_WORDMARK} alt="Mai Inji Wordmark" width={100} height={25} className="opacity-30 hover:opacity-100 transition-opacity duration-700 pointer-events-none md:pointer-events-auto grayscale" />
                </div>
            </div>
        </footer>
    );
}
