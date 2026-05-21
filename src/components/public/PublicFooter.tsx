import { Phone, MapPin, Clock, Mail, ChevronRight } from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/icons/InstagramIcon";
import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="bg-black border-t border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#c39b62]/10 via-black to-black pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#c39b62]/20 border border-[#c39b62] flex items-center justify-center">
                <span className="text-[#c39b62] font-black text-xl">ON</span>
              </div>
              <span className="text-2xl font-black tracking-widest text-white uppercase">
                ON FITNESS
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Discipline Today, Strength Tomorrow. Premium fitness experience with professional training, bodybuilding, and cardio in Ganaur.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/on_fitness_studio" target="_blank" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="mailto:contact@onfitness.com" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#c39b62] hover:text-black transition-all">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '#' },
                { name: 'About Us', href: '#about' },
                { name: 'Transformations', href: '#transformation' },
                { name: 'Gallery', href: '#gallery' },
                { name: 'Contact', href: '#contact' }
              ].map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-[#c39b62] transition-colors flex items-center gap-2 group text-sm">
                    <ChevronRight className="w-3 h-3 text-[#c39b62] opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Timings */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider">Timings</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 text-gray-400 text-sm">
                <Clock className="w-5 h-5 text-[#c39b62] shrink-0" />
                <div>
                  <p className="text-white font-medium mb-1">General Timings</p>
                  <p>5:00 AM to 10:00 PM</p>
                  <p>Open All Days</p>
                </div>
              </li>
              <li className="flex gap-3 text-gray-400 text-sm">
                <Clock className="w-5 h-5 text-[#c39b62] shrink-0" />
                <div>
                  <p className="text-white font-medium mb-1">Ladies Only</p>
                  <p>10:00 AM to 12:00 PM</p>
                  <p>2:00 PM to 4:00 PM</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 text-gray-400 text-sm">
                <MapPin className="w-5 h-5 text-[#c39b62] shrink-0" />
                <span>Khubru Road, Near Shiv Garden, Ganaur</span>
              </li>
              <li className="flex gap-3 text-gray-400 text-sm">
                <Phone className="w-5 h-5 text-[#c39b62] shrink-0" />
                <div className="flex flex-col">
                  <a href="tel:8400050073" className="hover:text-white transition-colors">8400050073</a>
                  <a href="tel:9017319009" className="hover:text-white transition-colors">9017319009</a>
                </div>
              </li>
              <li className="flex gap-3 text-gray-400 text-sm">
                <Mail className="w-5 h-5 text-[#c39b62] shrink-0" />
                <a href="mailto:contact@onfitness.com" className="hover:text-white transition-colors">contact@onfitness.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} ON FITNESS STUDIO. All rights reserved.
          </p>
          <div className="flex gap-6 text-gray-500 text-xs">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
