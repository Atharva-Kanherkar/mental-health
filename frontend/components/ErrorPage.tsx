'use client';

import { RefreshCw, Home, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { AppError } from '@/lib/error-handler';

interface ErrorPageProps {
  error: AppError;
  onRetry?: () => void;
  showContactSupport?: boolean;
}

export default function ErrorPage({ 
  error, 
  onRetry, 
  showContactSupport = true 
}: ErrorPageProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'auth':
        return '🔒';
      case 'network':
        return '📶';
      case 'validation':
        return '✏️';
      case 'server':
        return '⚠️';
      default:
        return '🤔';
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case 'auth':
        return 'text-blue-600 bg-blue-100';
      case 'network':
        return 'text-orange-600 bg-orange-100';
      case 'validation':
        return 'text-yellow-600 bg-yellow-100';
      case 'server':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA] px-4">
      {/* Floating background elements - matching app theme */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-100/20 to-pink-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-lg w-full relative z-10">
        <Card className="p-8 bg-white/30 backdrop-blur-sm border border-[#8B86B8]/20 rounded-3xl shadow-sm">
          {/* Error Icon & Emoji */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${getErrorColor()}`}>
              <span className="text-3xl">{getErrorIcon()}</span>
            </div>
          </div>

          {/* Error Content */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif font-light text-[#6B5FA8] mb-4">
              {error.title}
            </h1>
            
            <p className="text-lg text-[#8B86B8] font-light leading-relaxed mb-4">
              {error.message}
            </p>
            
            {error.suggestion && (
              <p className="text-sm text-[#8B86B8]/80 font-light italic">
                {error.suggestion}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {error.canRetry && onRetry && (
              <Button 
                onClick={onRetry}
                className="w-full bg-[#6B5FA8] hover:bg-[#5A4F98] text-white rounded-xl py-3 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                className="w-full border-[#8B86B8]/30 text-[#6B5FA8] hover:bg-[#8B86B8]/10 rounded-xl py-3 transition-all duration-200"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>

            {showContactSupport && (
              <Link href="/contact">
                <Button 
                  variant="ghost" 
                  className="w-full text-[#8B86B8] hover:bg-[#8B86B8]/10 rounded-xl py-3 transition-all duration-200"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </Link>
            )}
          </div>

          {/* Comforting Message */}
          <div className="mt-8 text-center">
            <p className="text-xs text-[#8B86B8]/70 font-light">
              Remember: every challenge in your healing journey makes you stronger. 
              We&apos;re here to support you through this.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
