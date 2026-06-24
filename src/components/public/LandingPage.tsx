"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Phone, MessageCircle, MapPin, Mail, CheckCircle2, Dumbbell, Activity, Users, Star, Quote, Clock, LayoutDashboard, UserCircle, Globe } from "lucide-react";
import Link from "next/link";
import { InstagramIcon as Instagram } from "@/components/icons/InstagramIcon";
import TopInfoBar from "./TopInfoBar";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import FloatingActions from "./FloatingActions";
import type { GalleryImage } from "@/app/actions/gallery";
import { useRef, useState } from "react";

export default function LandingPage({ initialGalleryImages }: { initialGalleryImages: GalleryImage[] }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const [inquiryStatus, setInquiryStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleInquiry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInquiryStatus("submitting");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const fitnessGoal = formData.get("fitnessGoal") as string;

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phoneNumber, fitnessGoal }),
      });
      if (res.ok) {
        setInquiryStatus("success");
      } else {
        setInquiryStatus("idle");
        alert("Failed to submit inquiry. Please try again.");
      }
    } catch (error) {
      console.error("Inquiry error:", error);
      setInquiryStatus("idle");
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="bg-[#0B0F19] min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#c39b62]/30">
      <TopInfoBar />
      <PublicNavbar />
      <FloatingActions />

      {/* 1. HERO SECTION */}
      <section className="relative h-screen flex items-end lg:items-center justify-center overflow-hidden pb-12 lg:pb-0 pt-20">
        <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
          <picture className="absolute inset-0 w-full h-full">
            <source srcSet="/images/owner/owner_hero_mobile.png" media="(max-width: 1023px)" />
            <img 
              src="/images/owner/owner_hero.png" 
              alt="ON FITNESS STUDIO Founder Sukchain Pahal" 
              className="w-full h-full object-cover object-[center_top] lg:object-[right_20%]"
              loading="eager"
            />
          </picture>
          {/* Mobile Overlay: dark gradient from bottom to top */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/70 to-[#0B0F19]/10 lg:hidden" />
          {/* Desktop Overlays */}
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#0B0F19] via-[#0B0F19]/80 to-[#0B0F19]/30" />
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-black/40" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full flex flex-col justify-end lg:justify-center"
          >
            <div className="inline-block px-4 py-1.5 rounded-full border border-[#c39b62]/30 bg-[#c39b62]/10 text-[#c39b62] font-bold text-xs tracking-widest uppercase mb-6 backdrop-blur-md self-start">
              Premium Fitness Experience
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[1.0] mb-4 text-white drop-shadow-2xl">
              Discipline Today <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c39b62] to-[#e5c088]">Strength Tomorrow</span>
            </h1>
            <p className="text-sm sm:text-base font-bold tracking-widest text-gray-300 uppercase mb-8 max-w-lg leading-relaxed">
              Building Stronger Bodies. Creating Stronger Lives.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#membership" className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#c39b62] to-[#b8956c] text-black font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_30px_rgba(195,155,98,0.3)] hover:shadow-[0_0_50px_rgba(195,155,98,0.5)] flex items-center justify-center gap-2 group text-sm">
                Join Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform animate-pulse" />
              </a>
              <a href="https://instagram.com/on_fitness_studio" target="_blank" className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-md text-sm">
                <span className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center mr-1">
                  <span className="border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-0.5" />
                </span>
                Watch Story
              </a>
            </div>

            {/* Bottom features bar inside the hero container */}
            <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-6 items-center justify-start text-[10px] sm:text-xs font-bold tracking-widest uppercase text-gray-400">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-[#c39b62]" />
                <span>Expert Coaching</span>
              </div>
              <div className="w-px h-4 bg-white/15 hidden sm:block" />
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#c39b62]" />
                <span>Personalized Nutrition</span>
              </div>
              <div className="w-px h-4 bg-white/15 hidden sm:block" />
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-[#c39b62]" />
                <span>Real Results</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:grid grid-cols-2 gap-4 relative"
          >
            <div className="absolute inset-0 bg-[#c39b62]/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="glass-panel p-6 rounded-2xl border border-white/10 backdrop-blur-xl translate-y-12">
              <Users className="w-8 h-8 text-[#c39b62] mb-4" />
              <h3 className="text-3xl font-black text-white mb-1">1000+</h3>
              <p className="text-sm text-gray-400 font-medium">Active Members</p>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
              <Dumbbell className="w-8 h-8 text-[#c39b62] mb-4" />
              <h3 className="text-3xl font-black text-white mb-1">15+</h3>
              <p className="text-sm text-gray-400 font-medium">Pro Trainers</p>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl border border-white/10 backdrop-blur-xl translate-y-12">
              <Activity className="w-8 h-8 text-[#c39b62] mb-4" />
              <h3 className="text-3xl font-black text-white mb-1">30+</h3>
              <p className="text-sm text-gray-400 font-medium">Fitness Programs</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 backdrop-blur-xl bg-[#c39b62]/10 border-[#c39b62]/30">
              <Clock className="w-8 h-8 text-[#c39b62] mb-4" />
              <h3 className="text-xl font-bold text-white mb-1">5 AM - 10 PM</h3>
              <p className="text-sm text-[#c39b62] font-medium">Open All Days</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 1.5. PORTAL ACCESS SECTION */}
      <section id="portals" className="py-24 relative z-20 bg-black/80 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">
              Access <span className="text-[#c39b62]">Portals</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Choose your destination. Seamlessly access the visitor website, member dashboard, or administration portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Visitor Website */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-white/30 group transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 relative z-10">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Visitor Website</h3>
              <p className="text-gray-400 leading-relaxed mb-8 flex-1 relative z-10">
                Explore our premium facilities, fitness programs, and membership options.
              </p>
              <a href="#about" className="w-full py-4 rounded-xl bg-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2 relative z-10 backdrop-blur-md">
                Explore Site <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Member Portal */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-8 rounded-3xl border border-[#c39b62]/20 hover:border-[#c39b62]/50 group transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_30px_rgba(195,155,98,0.03)] hover:shadow-[0_0_40px_rgba(195,155,98,0.15)]"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#c39b62]/10 rounded-full blur-[60px] group-hover:bg-[#c39b62]/30 transition-all duration-500" />
              <div className="w-16 h-16 rounded-full bg-[#c39b62]/10 border border-[#c39b62]/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#c39b62] transition-all duration-500 relative z-10">
                <UserCircle className="w-8 h-8 text-[#c39b62] group-hover:text-black transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Member Portal</h3>
              <p className="text-gray-400 leading-relaxed mb-8 flex-1 relative z-10">
                Access your personalized dashboard, track attendance, and manage payments.
              </p>
              <Link href="/member/login" className="w-full py-4 rounded-xl bg-gradient-to-r from-[#c39b62] to-[#b8956c] text-black font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 relative z-10 shadow-[0_0_20px_rgba(195,155,98,0.3)]">
                Member Login <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Admin Portal */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-8 rounded-3xl border border-primary/20 hover:border-primary/50 group transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_30px_rgba(59,130,246,0.05)] hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]"
            >
              <div className="absolute top-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] group-hover:bg-primary/30 transition-all duration-500" />
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary transition-all duration-500 relative z-10">
                <LayoutDashboard className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Admin Portal</h3>
              <p className="text-gray-400 leading-relaxed mb-8 flex-1 relative z-10">
                Gym management dashboard for staff, attendance tracking, and operations.
              </p>
              <Link href="/admin/login" className="w-full py-4 rounded-xl bg-primary text-white font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 relative z-10 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                Admin Login <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT SECTION */}
      <section id="about" className="py-24 relative z-10 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#c39b62]/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="relative rounded-3xl overflow-hidden border border-white/10 glass-panel">
                <img 
                  src="/images/owner/owner_posing.png" 
                  alt="ON FITNESS STUDIO Founder Sukchain Pahal" 
                  className="w-full h-auto object-cover opacity-95 hover:opacity-100 transition-all duration-700" 
                />
                <div className="absolute bottom-6 right-6 glass-panel px-6 py-4 rounded-xl border border-white/20">
                  <p className="text-white font-bold text-lg">Sukchain Pahal (Founder)</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-6"
            >
              <span className="text-sm font-bold tracking-widest text-[#c39b62] uppercase block">
                MEET THE FOUNDER & HEAD COACH
              </span>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                LEAD BY <span className="text-[#c39b62]">EXAMPLE</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Founded and guided by elite athlete and coach **Sukchain Pahal**, ON FITNESS STUDIO represents a commitment to physical excellence. Sukchain brings years of training experience, postural correction techniques, and a structured progressive overload philosophy to Ganaur.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Whether you want to build raw power, sculpt a competitive physique, or make a complete lifestyle change, our gym provides the expert environment to make it happen.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {['Imported Heavy Equipment', 'Custom Nutrition Design', 'Scientific Training Plans', 'Dedicated Ladies Batch'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#c39b62]/20 flex items-center justify-center border border-[#c39b62]/55">
                      <CheckCircle2 className="w-3 h-3 text-[#c39b62]" />
                    </div>
                    <span className="text-white font-medium text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2.5. FOUNDER'S & MEMBER'S TRANSFORMATION SHOWCASE */}
      <section id="transformation" className="py-24 relative z-10 bg-black/40 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full border border-[#c39b62]/30 bg-[#c39b62]/10 text-[#c39b62] font-bold text-xs tracking-widest uppercase mb-4 backdrop-blur-md">
              Proof In Results
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">
              Real People. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c39b62] to-[#e5c088]">Real Results.</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg">
              Witness the power of consistency. These are real results built through our structured progressive overload training and customized nutrition methodologies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                url: "/images/gym/sukchain_pose.png",
                title: "SUKCHAIN PAHAL - PEAK SHRED",
                tag: "Founder & Trainer",
                desc: "Demonstrating elite body recomposition, muscular definition, and symmetrical conditioning."
              },
              {
                url: "/images/gym/sukchain_flex.png",
                title: "HYPERTROPHY & DENSITY",
                tag: "Advanced Form",
                desc: "Showcasing peak muscle density, full muscle bellies, and optimal athletic performance."
              },
              {
                url: "/images/gym/coach_stairs.png",
                title: "ATHLETIC CONDITIONING",
                tag: "Strength & Power",
                desc: "Focusing on postural alignment, raw compound power, and functional athletic structure."
              }
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel rounded-3xl border border-white/10 hover:border-[#c39b62]/40 overflow-hidden transition-all duration-500 group relative flex flex-col h-full bg-black/40 shadow-lg"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img 
                    src={card.url} 
                    alt={card.title} 
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 bg-[#c39b62]/10 border border-[#c39b62]/30 text-[#c39b62] font-black uppercase tracking-wider text-[10px] rounded">
                      {card.tag}
                    </span>
                    <h4 className="text-lg font-black uppercase text-white mt-3 tracking-tight">
                      {card.title}
                    </h4>
                    <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Coach's Peak Conditioning Highlight */}
          <div className="mt-16 bg-gradient-to-r from-black/80 to-[#0B0F19]/80 border border-white/15 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/images/owner/owner_posing.png')] bg-cover bg-center opacity-5 mix-blend-overlay group-hover:scale-105 transition-transform duration-[2000ms]" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-8 space-y-4">
                <span className="text-[#c39b62] text-xs font-black uppercase tracking-widest block">FOUNDER'S CONDITIONING</span>
                <h3 className="text-3xl font-black uppercase text-white">Elite Head Coach Peak Physique</h3>
                <p className="text-gray-300 text-sm max-w-xl leading-relaxed">
                  We lead by example. Sukchain Pahal's physical conditioning represents the absolute peak of natural bodybuilding, postural alignment, and physical performance. Access his training splits, hypertrophy protocols, and competitive prep structures.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <a href="#coaches" className="px-6 py-3 rounded-xl border border-[#c39b62]/30 bg-[#c39b62]/5 hover:bg-[#c39b62]/10 text-white font-bold text-xs uppercase tracking-widest transition-all">
                    View Workout Splits
                  </a>
                </div>
              </div>
              <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[3/4] hover:border-[#c39b62]/40 transition-colors duration-500">
                  <img src="/images/owner/owner_flexing.png" alt="Owner flexing" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[10px] font-black uppercase tracking-wide text-white bg-black/60 px-2 py-0.5 rounded border border-white/10">Peak Bulk</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[3/4] hover:border-[#c39b62]/40 transition-colors duration-500">
                  <img src="/images/owner/owner_posing.png" alt="Owner posing" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[10px] font-black uppercase tracking-wide text-white bg-black/60 px-2 py-0.5 rounded border border-white/10">Competition Form</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SERVICES SECTION */}
      <section id="services" className="py-24 relative bg-black/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">
              Premium <span className="text-[#c39b62]">Services</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Tailored fitness programs designed to transform your physique and enhance your performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Personal Training", desc: "1-on-1 expert guidance tailored to your specific fitness goals.", icon: Users },
              { title: "Body Building", desc: "Heavy lifting zones and specialized equipment for muscle hypertrophy.", icon: Dumbbell },
              { title: "Cardio & Fat Loss", desc: "Modern treadmills, ellipticals, and high-intensity interval training.", icon: Activity },
            ].map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-[#c39b62]/50 group transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c39b62]/10 rounded-full blur-3xl group-hover:bg-[#c39b62]/20 transition-all" />
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-[#c39b62] transition-colors duration-300">
                  <service.icon className="w-7 h-7 text-[#c39b62] group-hover:text-black transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{service.title}</h3>
                <p className="text-gray-400 leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3.5. COACHES SECTION */}
      <section id="coaches" className="py-24 relative bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-6"
            >
              <div className="inline-block px-4 py-1.5 rounded-full border border-[#c39b62]/30 bg-[#c39b62]/10 text-[#c39b62] font-bold text-xs tracking-widest uppercase mb-2 backdrop-blur-md">
                Expert Guidance
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                Train With <span className="text-[#c39b62]">The Best</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Led by our founder and head trainer, ON FITNESS STUDIO is built on real coaching, posture correction, and tailored plans to ensure safety and optimized results for weight loss or muscle gain.
              </p>
              <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md">
                <h4 className="text-xl font-bold text-white mb-2">Personalized Coaching Plans</h4>
                <p className="text-gray-400 text-sm">
                  Get customized workout regimes, detailed nutrition tips, and progressive overload tracking to crush your goals in Ganaur.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#c39b62]/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="relative rounded-3xl overflow-hidden border border-white/10 glass-panel">
                <img 
                  src="/images/owner/owner_posing.png" 
                  alt="Founder & Trainer Sukchain Pahal" 
                  className="w-full h-[500px] object-cover opacity-90 hover:opacity-100 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 glass-panel p-6 rounded-xl border border-white/20">
                  <p className="text-white font-black text-xl uppercase">Sukchain Pahal</p>
                  <p className="text-[#c39b62] text-sm font-semibold">Founder & Head Trainer</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. DYNAMIC GALLERY SECTION */}
      <section id="gallery" className="py-24 relative bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">
                The <span className="text-[#c39b62]">Arena</span>
              </h2>
              <p className="text-gray-400 max-w-xl">Take a look inside our premium facility. A modern environment engineered for maximum results.</p>
            </div>
            <a href="https://instagram.com/on_fitness_studio" target="_blank" className="flex items-center gap-2 text-white hover:text-[#c39b62] transition-colors uppercase font-bold tracking-widest text-sm">
              <Instagram className="w-5 h-5" /> Follow Us
            </a>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {[
              ...initialGalleryImages,
              { id: "static_owner_flexing", url: "/images/owner/owner_flexing.png", caption: "Sukchain Pahal - Peak Hypertrophy", order: 10 },
              { id: "static_owner_posing", url: "/images/owner/owner_posing.png", caption: "Sukchain Pahal - Competition Form", order: 11 },
            ].filter((img, idx, arr) => arr.findIndex(x => x.url === img.url) === idx).map((img, i) => {
              const isVideo = img.url.includes("/video/upload/") || img.url.match(/\.(mp4|webm|ogg|mov)/i) !== null;
              return (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative rounded-2xl overflow-hidden group cursor-pointer break-inside-avoid border border-white/10"
                >
                  {isVideo ? (
                    <video 
                      src={img.url} 
                      controls 
                      className="w-full h-auto object-cover"
                      preload="metadata"
                    />
                  ) : (
                    <img src={img.url} alt={img.caption} className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 pointer-events-none">
                    <p className="text-white font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{img.caption}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. INQUIRY / CONTACT SECTION */}
      <section id="membership" className="py-24 relative bg-black/80 border-t border-white/5">
        <div className="absolute inset-0 bg-[url('/images/gym/entrance_1.png')] bg-cover bg-center opacity-10 mix-blend-luminosity pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Inquiry Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-2xl"
            >
              <h3 className="text-3xl font-black text-white uppercase mb-2">Claim Your Pass</h3>
              <p className="text-gray-400 mb-8">Inquire about memberships. No online payment required.</p>
              
              <form onSubmit={handleInquiry} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Full Name</label>
                  <input type="text" name="name" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#c39b62] transition-colors" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Phone Number</label>
                  <input type="tel" name="phoneNumber" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#c39b62] transition-colors" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Fitness Goal</label>
                  <select name="fitnessGoal" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#c39b62] transition-colors appearance-none">
                    <option>Weight Loss</option>
                    <option>Muscle Building</option>
                    <option>General Fitness</option>
                    <option>Personal Training</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={inquiryStatus !== "idle"}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#c39b62] to-[#b8956c] text-black font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(195,155,98,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inquiryStatus === "idle" ? "Submit Inquiry" : inquiryStatus === "submitting" ? "Sending..." : "Inquiry Sent Successfully!"}
                </button>
              </form>
            </motion.div>

            {/* Contact Details & Map */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
              id="contact"
            >
              <div>
                <h3 className="text-4xl font-black text-white uppercase mb-6">Contact <span className="text-[#c39b62]">Us</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a href="tel:8400050073" className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#c39b62]/50 transition-all group flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#c39b62] transition-colors">
                      <Phone className="w-5 h-5 text-[#c39b62] group-hover:text-black" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Call Us</p>
                      <p className="text-white font-medium">8400050073</p>
                    </div>
                  </a>
                  <a href="mailto:contact@onfitness.com" className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#c39b62]/50 transition-all group flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#c39b62] transition-colors">
                      <Mail className="w-5 h-5 text-[#c39b62] group-hover:text-black" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Email Us</p>
                      <p className="text-white font-medium">Click to send</p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#c39b62]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Location</p>
                    <p className="text-white font-medium leading-relaxed">Khubru Road, Near Shiv Garden, Ganaur</p>
                  </div>
                </div>
                {/* Map Placeholder */}
                <div className="w-full h-48 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('/images/gym/entrance_2.png')] bg-cover bg-center opacity-30 mix-blend-luminosity transition-transform duration-1000 group-hover:scale-110" />
                  <MapPin className="w-8 h-8 text-[#c39b62] relative z-10" />
                  <a href="https://maps.google.com" target="_blank" className="relative z-10 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold hover:bg-white/20 transition-all uppercase tracking-widest">
                    Get Directions
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
