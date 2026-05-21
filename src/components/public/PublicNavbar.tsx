"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/icons/InstagramIcon";
import Link from "next/link";

const navLinks = [
  { name: "Home", href: "#" },
  { name: "About", href: "#about" },
  { name: "Transformations", href: "#transformation" },
  { name: "Gallery", href: "#gallery" },
  { name: "Membership", href: "#membership" },
  { name: "Contact", href: "#contact" },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 md:top-10 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] md:top-0 py-4" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#c39b62]/20 border border-[#c39b62] flex items-center justify-center shadow-[0_0_15px_rgba(195,155,98,0.3)]">
              <span className="text-[#c39b62] font-black text-xl">ON</span>
            </div>
            <span className="text-2xl font-black tracking-widest text-white uppercase font-sans">
              ON FITNESS
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex flex-1 justify-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-bold text-gray-300 hover:text-white uppercase tracking-widest relative group transition-colors"
              >
                {link.name}
                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-[#c39b62] transition-all group-hover:w-full shadow-[0_0_10px_rgba(195,155,98,0.6)]" />
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="https://instagram.com/on_fitness_studio" 
              target="_blank" 
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:border-[#c39b62] hover:bg-[#c39b62]/10 hover:shadow-[0_0_15px_rgba(195,155,98,0.2)] transition-all"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#membership" className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#c39b62] to-[#b8956c] text-black font-bold tracking-wider uppercase text-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(195,155,98,0.3)] hover:shadow-[0_0_30px_rgba(195,155,98,0.5)]">
              Join Now
            </a>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b border-white/10">
              <span className="text-xl font-black tracking-widest text-white uppercase">ON FITNESS</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col items-center justify-center gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-2xl font-bold text-gray-300 hover:text-[#c39b62] uppercase tracking-widest"
                >
                  {link.name}
                </motion.a>
              ))}
            </nav>
            <div className="p-8 flex flex-col gap-4">
              <a href="#membership" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 rounded-xl bg-[#c39b62] text-black font-bold tracking-wider uppercase text-center flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(195,155,98,0.3)]">
                Join Now
              </a>
              <a href="https://instagram.com/on_fitness_studio" target="_blank" className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold tracking-wider uppercase text-center flex justify-center items-center gap-2">
                <Instagram className="w-5 h-5" /> Instagram
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
