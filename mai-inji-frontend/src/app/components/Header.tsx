"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, memo } from "react";
import Button from "./ui/Button";
import { LOGO_PRIMARY } from "../../lib/assets";
import { logoVariant, headerVariant } from "../../lib/variants";

const Header = memo(function Header() {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const isScrolled = latest > 20;
        if (scrolled !== isScrolled) {
            setScrolled(isScrolled);
        }
    });

    return (
        <m.header
            variants={headerVariant}
            initial="top"
            animate={(isHome && !scrolled) ? "top" : "scrolled"}
            className="sticky top-0 z-50 glass border-b border-gray-100 dark:border-gray-800"
        >
            <div className="container mx-auto px-4 flex items-center justify-between h-full">
                <Link href="/" className="transition-transform duration-300 hover:scale-105">
                    <m.div
                        initial={isHome ? "hidden" : "visible"}
                        animate="visible"
                        variants={logoVariant}
                    >
                        <Image
                            src={LOGO_PRIMARY}
                            alt="Mai Inji - Afro Fusion Fast Food"
                            width={120}
                            height={60}
                            className="h-12 w-auto object-contain"
                            priority
                        />
                    </m.div>
                </Link>

                <nav className="hidden md:block">
                    <ul className="flex items-center gap-8 font-bold text-sm tracking-widest uppercase">
                        <li><Link href="/menu" className="hover:text-green-600 transition-colors">Menu</Link></li>
                        <li><Link href="/about" className="hover:text-green-600 transition-colors">Our Story</Link></li>
                        <li>
                            <Link href="/menu">
                                <Button variant="primary" size="md" className="rounded-full shadow-lg shadow-green-600/20">
                                    Order Now
                                </Button>
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/menu">
                        <Button variant="primary" size="md">
                            Order Now
                        </Button>
                    </Link>
                </div>
            </div>
        </m.header>
    );
});

export default Header;

