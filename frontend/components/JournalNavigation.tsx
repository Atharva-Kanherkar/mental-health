'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Heart, 
  Award,
  Calendar,
  ChevronDown,
  Edit3
} from 'lucide-react';

const journalRoutes = [
  {
    href: '/journal',
    label: 'My Journal',
    icon: BookOpen,
    description: 'View all entries'
  },
  {
    href: '/journal/new',
    label: 'New Entry', 
    icon: Edit3,
    description: 'Write today'
  },
  {
    href: '/checkin',
    label: 'Daily Check-in',
    icon: Calendar,
    description: 'How are you feeling?'
  },
  {
    href: '/rewards',
    label: 'Rewards',
    icon: Award,
    description: 'Your achievements'
  }
];

export default function JournalNavigation() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  
  // Check if we're on any journal-related page
  const isJournalRoute = journalRoutes.some(route => pathname?.startsWith(route.href));
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {/* Expanded Menu */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 w-64 p-4 bg-white/95 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/20 shadow-xl mb-2">
            <div className="space-y-2">
              <h3 className="text-sm font-serif text-[#6B5FA8] mb-3 px-2">
                Journaling Journey
              </h3>
              {journalRoutes.map((route) => {
                const Icon = route.icon;
                const isActive = pathname === route.href;
                
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
                      isActive 
                        ? "bg-[#EBE7F8] text-[#6B5FA8]" 
                        : "text-[#8B86B8] hover:bg-[#F0EDFA] hover:text-[#6B5FA8]"
                    )}
                    onClick={() => setIsExpanded(false)}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive 
                        ? "bg-[#6B5FA8] text-white" 
                        : "bg-[#F0EDFA] text-[#8B86B8] group-hover:bg-[#EBE7F8] group-hover:text-[#6B5FA8]"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-light text-sm">{route.label}</p>
                      <p className="text-xs opacity-70">{route.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group",
            isJournalRoute
              ? "bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] text-white shadow-[#6B5FA8]/25"
              : "bg-white text-[#6B5FA8] border border-[#8B86B8]/20 hover:bg-[#F0EDFA]",
            isExpanded && "scale-110"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            <Heart className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
