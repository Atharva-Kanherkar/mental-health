'use client';

import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';

interface ActionItem {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}

interface GroupedActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actions: ActionItem[];
}

export function GroupedActionsModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  actions 
}: GroupedActionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-gradient-to-br from-white/95 to-purple-50/90 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-2xl bg-white/60 hover:bg-white/80 transition-all duration-200 hover:scale-110"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="pt-10 pb-8 px-10">
          <h3 className="text-3xl font-serif text-gray-800 mb-4 tracking-wide">{title}</h3>
          <p className="text-gray-600 font-light leading-relaxed text-lg">{description}</p>
          <div className="mt-4 w-20 h-1 bg-gradient-to-r from-[#6B5FA8] to-purple-300 rounded-full"></div>
        </div>

        {/* Actions */}
        <div className="px-10 pb-10 space-y-6">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <button
                onClick={onClose}
                className="w-full p-6 rounded-2xl bg-white/60 hover:bg-white/80 border border-white/40 hover:border-[#6B5FA8]/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6B5FA8]/10 to-purple-200/20 flex items-center justify-center mr-6 group-hover:from-[#6B5FA8]/20 group-hover:to-purple-200/30 transition-all duration-300">
                    <action.icon className="h-7 w-7 text-[#6B5FA8]" />
                  </div>
                  <div className="flex-1 text-left min-w-0 mr-4">
                    <p className="font-semibold text-lg text-gray-800 mb-2 tracking-wide">{action.label}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#6B5FA8] group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                </div>
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
