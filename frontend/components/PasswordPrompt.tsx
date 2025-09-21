'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Lock, Shield } from 'lucide-react';

interface PasswordPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function PasswordPrompt({
  isOpen,
  onClose,
  onConfirm,
  title = "Enter Your Password",
  description = "We need your password to encrypt your files securely.",
  isLoading = false
}: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    onConfirm(password);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-lg border-[#8B86B8]/30 rounded-3xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-[#6B5FA8]/20 to-[#8B86B8]/10 rounded-2xl w-fit">
            <Shield className="w-8 h-8 text-[#6B5FA8]" />
          </div>
          <DialogTitle className="text-2xl font-serif font-light text-[#6B5FA8]">
            {title}
          </DialogTitle>
          <p className="text-[#8B86B8] font-light mt-2">
            {description}
          </p>
        </DialogHeader>

        <div className="bg-[#EBE7F8]/30 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-[#6B5FA8] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[#6B5FA8] font-light">
              <p className="font-medium mb-1">Your privacy is our promise:</p>
              <ul className="space-y-1 text-xs opacity-90">
                <li>• Your password never leaves your device</li>
                <li>• Files are encrypted before uploading</li>
                <li>• Only you can decrypt your memories</li>
                <li>• Even we cannot access your data</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-light text-[#6B5FA8] mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your secure password..."
                className="rounded-2xl border-[#8B86B8]/30 focus:border-[#6B5FA8] bg-white/60 backdrop-blur-sm font-light pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B86B8] hover:text-[#6B5FA8] transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-sm font-light mt-1">{error}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 rounded-2xl border-[#8B86B8]/30 text-[#8B86B8] hover:bg-white/30 hover:border-[#6B5FA8] font-light"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 rounded-2xl bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] hover:from-[#5A4F97] hover:to-[#7A75A7] text-white font-light"
            >
              {isLoading ? 'Processing...' : 'Continue Securely'}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-amber-50/80 rounded-2xl border-l-4 border-amber-400">
          <p className="text-amber-800 text-xs font-light">
            <strong>Important:</strong> If you forget this password, your encrypted files will be permanently lost. 
            There is no recovery option - this is the price of true privacy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
