"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { LOGO_PRIMARY, LOGO_WORDMARK } from "../../lib/assets";
import { secondaryLogoVariant } from "../../lib/variants";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-[var(--cream)] text-gray-800 py-16 border-t border-gray-200 relative overflow-hidden">
            {/* Ambient Rotating H2 Logo Accent */}
            <motion.div
                className="absolute -top-24 -right-24 w-96 h-96 pointer-events-none select-none z-0"
                variants={secondaryLogoVariant}
                animate="animate"
            >
                <Image
                    src={LOGO_PRIMARY}
                    alt=""
                    fill
                    className="object-contain opacity-10 grayscale"
                />
            </motion.div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Image src={LOGO_PRIMARY} alt="Mai Inji brand mark" width={100} height={40} className="mb-6 opacity-90 grayscale hover:grayscale-0 transition-all duration-500" />
                        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                            Experience the vibrant intersection of Afro-fusion flavors and artisan fast food at Mai Inji.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-green-600">Explore</h4>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link href="/menu" className="hover:text-green-600 transition-colors">Menu</Link></li>
                            <li><Link href="/about" className="hover:text-green-600 transition-colors">Our Story</Link></li>
                            <li><Link href="/franchise" className="hover:text-green-600 transition-colors">Franchise</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-green-600">Location</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            Lafia, Nasarawa State<br />
                            Nigeria
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-green-600">Connect</h4>
                        <div className="flex space-x-4">
                            {/* Social Icons Placeholder */}
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm">
                                <span className="sr-only">Instagram</span>
                                📷
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm">
                                <span className="sr-only">Twitter</span>
                                🐦
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-400 tracking-wider">
                        © {new Date().getFullYear()} MAI INJI. CRAFTED FOR FLAVOR.
                    </p>
                    <Image src={LOGO_WORDMARK} alt="Mai Inji Wordmark" width={120} height={30} className="opacity-20 hover:opacity-100 transition-opacity duration-700 pointer-events-none md:pointer-events-auto" />
                </div>
            </div>
        </footer>
    );
}
