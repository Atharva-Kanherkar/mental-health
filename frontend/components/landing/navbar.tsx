"use client"
import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-4xl">
      
        <div className="bg-white/70 backdrop-blur-md rounded-full px-4 md:px-8 py-2.5 md:py-3 shadow-lg border border-white/20 flex items-center justify-between md:justify-center md:gap-8">
          {/* Logo / Brand */}
          <Link href="/" className="text-base md:text-lg font-light tracking-tight text-[#5D5A8C] hover:text-[#4C4977] transition-colors">
            Echoes
          </Link>

          {/* Desktop Links */}
          <ul className="hidden lg:flex items-center gap-6 text-[#6E6B95] font-light text-sm">
            <li>
              <Link href="/" className="hover:text-[#4C4977] transition-colors cursor-pointer">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-[#4C4977] transition-colors cursor-pointer">
                About
              </Link>
            </li>
            <li>
              <Link href="/resources" className="hover:text-[#4C4977] transition-colors cursor-pointer">
                Resources
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[#4C4977] transition-colors cursor-pointer">
                Contact
              </Link>
            </li>
          </ul>

          {/* Desktop Separator */}
          <div className="w-px h-4 bg-[#D5D1E8] hidden lg:block"></div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X size={20} className="text-[#5D5A8C]" />
            ) : (
              <Menu size={20} className="text-[#5D5A8C]" />
            )}
          </button>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex">
            {user ? (
              <div className="flex items-center gap-2">
                <Link 
                  href="/dashboard" 
                  className="px-3 py-1.5 md:px-4 md:py-1.5 rounded-full bg-[#E6E1F7] text-[#4C4977] hover:bg-[#D8D2F2] transition-colors text-xs md:text-sm font-normal whitespace-nowrap"
                >
                  Find Peace
                </Link>
                <button 
                  onClick={logout}
                  className="px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-[#4C4977] hover:bg-[#E6E1F7] transition-colors text-xs md:text-sm font-normal whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/auth/login" 
                  className="px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-[#4C4977] hover:bg-[#E6E1F7] transition-colors text-xs md:text-sm font-normal whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="px-3 py-1.5 md:px-4 md:py-1.5 rounded-full bg-[#E6E1F7] text-[#4C4977] hover:bg-[#D8D2F2] transition-colors text-xs md:text-sm font-normal whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Mobile Menu */}
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6">
            {/* Mobile Navigation Links */}
            <ul className="space-y-4 mb-6">
              <li>
                <Link 
                  href="/" 
                  className="block py-2 text-[#6E6B95] hover:text-[#4C4977] transition-colors font-light"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="block py-2 text-[#6E6B95] hover:text-[#4C4977] transition-colors font-light"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  href="/resources" 
                  className="block py-2 text-[#6E6B95] hover:text-[#4C4977] transition-colors font-light"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Resources
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="block py-2 text-[#6E6B95] hover:text-[#4C4977] transition-colors font-light"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
              </li>
            </ul>

            {/* Mobile Auth Buttons */}
            <div className="border-t border-[#D5D1E8] pt-4">
              {user ? (
                <div className="space-y-3">
                  <Link 
                    href="/dashboard" 
                    className="block w-full py-2.5 px-4 rounded-full bg-[#E6E1F7] text-[#4C4977] hover:bg-[#D8D2F2] transition-colors text-sm font-normal text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Find Peace
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full py-2.5 px-4 rounded-full text-[#4C4977] hover:bg-[#E6E1F7] transition-colors text-sm font-normal"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link 
                    href="/auth/login" 
                    className="block w-full py-2.5 px-4 rounded-full text-[#4C4977] hover:bg-[#E6E1F7] transition-colors text-sm font-normal text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="block w-full py-2.5 px-4 rounded-full bg-[#E6E1F7] text-[#4C4977] hover:bg-[#D8D2F2] transition-colors text-sm font-normal text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
