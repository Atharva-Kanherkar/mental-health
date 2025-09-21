"use client"
import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-4xl">
    
      <div className="bg-white/70 backdrop-blur-md rounded-full px-4 md:px-8 py-2.5 md:py-3 shadow-lg border border-white/20 flex items-center justify-between md:justify-center md:gap-8">
        {/* Logo / Brand */}
        <Link href="/" className="text-base md:text-lg font-light tracking-tight text-[#5D5A8C] hover:text-[#4C4977] transition-colors">
          Echoes
        </Link>

        {/* Desktop Links */}
        <ul className="hidden lg:flex items-center gap-6 text-[#6E6B95] font-light text-sm">
          <li className="hover:text-[#4C4977] transition-colors cursor-pointer">Home</li>
          <li className="hover:text-[#4C4977] transition-colors cursor-pointer">About</li>
          <li className="hover:text-[#4C4977] transition-colors cursor-pointer">Resources</li>
          <li className="hover:text-[#4C4977] transition-colors cursor-pointer">Contact</li>
        </ul>

        {/* Separator */}
        <div className="w-px h-4 bg-[#D5D1E8] hidden lg:block"></div>

        {/* Auth Buttons */}
        {user ? (
          <div className="flex items-center gap-2">
            <Link 
              href="/dashboard" 
              className="px-3 py-1.5 md:px-4 md:py-1.5 rounded-full bg-[#E6E1F7] text-[#4C4977] hover:bg-[#D8D2F2] transition-colors text-xs md:text-sm font-normal whitespace-nowrap"
            >
              Dashboard
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
    </nav>
  );
}
