'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signup(data.email, data.username, data.password);
      toast.success('Account created successfully!');
      router.push('/onboarding');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA] px-4">
      {/* Subtle floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-100/20 to-pink-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-10 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#6B5FA8] mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Create Your Sanctuary
          </h1>
          <p className="text-[#8B86B8] font-light opacity-80">Begin your journey of gentle healing</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-light text-[#6B5FA8] mb-2 opacity-90">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Your email address"
              {...register('email')}
              className={`rounded-full bg-white/50 border-[#8B86B8]/20 text-[#6B5FA8] placeholder-[#8B86B8]/60 font-light focus:bg-white/70 focus:border-[#6B5FA8]/30 transition-all duration-300 ${errors.email ? 'border-red-400' : ''}`}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-2 font-light">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-light text-[#6B5FA8] mb-2 opacity-90">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Your unique name in this space"
              {...register('username')}
              className={`rounded-full bg-white/50 border-[#8B86B8]/20 text-[#6B5FA8] placeholder-[#8B86B8]/60 font-light focus:bg-white/70 focus:border-[#6B5FA8]/30 transition-all duration-300 ${errors.username ? 'border-red-400' : ''}`}
            />
            {errors.username && (
              <p className="text-red-400 text-sm mt-2 font-light">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-light text-[#6B5FA8] mb-2 opacity-90">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="A secure key to your sanctuary"
              {...register('password')}
              className={`rounded-full bg-white/50 border-[#8B86B8]/20 text-[#6B5FA8] placeholder-[#8B86B8]/60 font-light focus:bg-white/70 focus:border-[#6B5FA8]/30 transition-all duration-300 ${errors.password ? 'border-red-400' : ''}`}
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-2 font-light">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-light text-[#6B5FA8] mb-2 opacity-90">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your secure key"
              {...register('confirmPassword')}
              className={`rounded-full bg-white/50 border-[#8B86B8]/20 text-[#6B5FA8] placeholder-[#8B86B8]/60 font-light focus:bg-white/70 focus:border-[#6B5FA8]/30 transition-all duration-300 ${errors.confirmPassword ? 'border-red-400' : ''}`}
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-2 font-light">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 border-0 font-light py-3 mt-8"
            disabled={isLoading}
          >
            {isLoading ? 'Building your sanctuary...' : 'Create Your Sanctuary'}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-[#8B86B8] font-light opacity-80">
            Already have a sanctuary?{' '}
            <Link href="/auth/login" className="text-[#6B5FA8] hover:opacity-80 transition-opacity underline">
              Return home
            </Link>
          </p>
        </div>

        <div className="text-center">
          <Link href="/" className="text-[#8B86B8] hover:text-[#6B5FA8] text-sm font-light opacity-70 hover:opacity-100 transition-all duration-300">
            ← Return to the beginning
          </Link>
        </div>
      </div>
    </div>
  );
}
