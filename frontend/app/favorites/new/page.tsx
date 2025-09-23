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
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { favoritesApi } from '@/lib/api-client';
import { 
  ArrowLeft,
  Heart,
  User
} from 'lucide-react';

const personSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  relationship: z.string()
    .min(1, 'Relationship is required')
    .max(50, 'Relationship must be less than 50 characters'),
  priority: z.number()
    .int()
    .min(1, 'Priority must be at least 1')
    .max(10, 'Priority must be at most 10'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

type PersonFormData = z.infer<typeof personSchema>;

const commonRelationships = [
  'Parent', 'Mother', 'Father', 'Sister', 'Brother', 'Child', 'Son', 'Daughter',
  'Partner', 'Spouse', 'Boyfriend', 'Girlfriend', 'Husband', 'Wife',
  'Best Friend', 'Friend', 'Close Friend', 'Childhood Friend',
  'Grandparent', 'Grandmother', 'Grandfather', 'Aunt', 'Uncle', 'Cousin',
  'Mentor', 'Teacher', 'Colleague', 'Neighbor'
];

export default function NewFavoritePersonPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
  });

  const watchedName = watch('name');
  const watchedDescription = watch('description');

  const onSubmit = async (data: PersonFormData) => {
    if (!user) {
      toast.error('Please log in to add favorite people');
      return;
    }

    setIsLoading(true);
    try {
      await favoritesApi.create({
        name: data.name.trim(),
        relationship: data.relationship.trim(),
        priority: data.priority,
        description: data.description?.trim() || undefined,
      });

      toast.success(`${data.name} added to your favorites! 💖`);
      router.push('/favorites');
    } catch {
      toast.error('Unable to add this person right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelationshipClick = (relationship: string) => {
    setValue('relationship', relationship);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EBE7F8] via-[#F8F6FF] to-[#E8E3F5] relative">
      {/* Floating background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-[#6B5FA8]/10 to-[#8B86B8]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-16 w-80 h-80 bg-gradient-to-tl from-[#8B86B8]/8 to-[#6B5FA8]/3 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-r from-[#EBE7F8]/20 to-[#6B5FA8]/5 rounded-full blur-2xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-[#6B5FA8] hover:bg-white/20 rounded-2xl font-light">
              <Link href="/favorites">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Your Circle
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-light text-[#6B5FA8]">Add Someone Special</h1>
              <p className="text-[#8B86B8] font-light">Welcome another soul to your sanctuary</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        <Card className="p-8 bg-white/20 backdrop-blur-lg border-white/30 rounded-3xl shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-[#6B5FA8]/20 to-[#8B86B8]/10 rounded-2xl backdrop-blur-sm">
              <Heart className="w-7 h-7 text-[#6B5FA8]" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-light text-[#6B5FA8]">Who brings light to your world?</h2>
              <p className="text-[#8B86B8] font-light">Share about someone who holds meaning in your heart</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-lg font-serif font-light text-[#6B5FA8] mb-3">
                What do you call them? *
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B86B8]/60" />
                <Input
                  id="name"
                  placeholder="Mom, Sarah, Alex, or however they're known to your heart..."
                  {...register('name')}
                  className={`pl-12 rounded-2xl border-[#8B86B8]/30 focus:border-[#6B5FA8] bg-white/50 backdrop-blur-sm font-light ${errors.name ? 'border-red-300' : ''}`}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                {errors.name && (
                  <p className="text-red-300 text-sm font-light">{errors.name.message}</p>
                )}
                <div className="text-xs text-[#8B86B8] font-light opacity-75">
                  {watchedName?.length || 0}/100 characters
                </div>
              </div>
            </div>

            {/* Relationship Field */}
            <div>
              <label htmlFor="relationship" className="block text-lg font-serif font-light text-[#6B5FA8] mb-3">
                How are they connected to you? *
              </label>
              <Input
                id="relationship"
                placeholder="Best Friend, Sister, Mom, Partner, Mentor..."
                {...register('relationship')}
                className={`rounded-2xl border-[#8B86B8]/30 focus:border-[#6B5FA8] bg-white/50 backdrop-blur-sm font-light ${errors.relationship ? 'border-red-300' : ''}`}
              />
              {errors.relationship && (
                <p className="text-red-300 text-sm font-light mt-1">{errors.relationship.message}</p>
              )}

              {/* Common Relationships */}
              <div className="mt-4">
                <p className="text-sm text-[#8B86B8] font-light mb-3">Or choose from these:</p>
                <div className="flex flex-wrap gap-2">
                  {commonRelationships.slice(0, 12).map((relationship) => (
                    <button
                      key={relationship}
                      type="button"
                      onClick={() => handleRelationshipClick(relationship)}
                      className="px-4 py-2 text-sm font-light border border-[#8B86B8]/30 rounded-2xl bg-white/30 backdrop-blur-sm hover:border-[#6B5FA8] hover:text-[#6B5FA8] hover:bg-white/50 transition-all duration-200"
                    >
                      {relationship}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority Field */}
            <div>
              <label htmlFor="priority" className="block text-lg font-serif font-light text-[#6B5FA8] mb-3">
                How important are they to you? *
              </label>
              <select
                id="priority"
                {...register('priority', { valueAsNumber: true })}
                className={`w-full rounded-2xl border-[#8B86B8]/30 focus:border-[#6B5FA8] bg-white/50 backdrop-blur-sm font-light px-4 py-3 ${errors.priority ? 'border-red-300' : ''}`}
              >
                <option value="">Choose their importance level...</option>
                <option value={1}>Most Important (1) - My closest person</option>
                <option value={2}>Extremely Important (2) - One of my dearest</option>
                <option value={3}>Very Important (3) - Someone I deeply value</option>
                <option value={4}>Quite Important (4) - Someone I care about greatly</option>
                <option value={5}>Important (5) - A meaningful presence</option>
                <option value={6}>Moderately Important (6) - Someone I appreciate</option>
                <option value={7}>Somewhat Important (7) - A valued connection</option>
                <option value={8}>Friendly Important (8) - Someone I enjoy</option>
                <option value={9}>Casually Important (9) - A pleasant connection</option>
                <option value={10}>Generally Important (10) - Someone I know well</option>
              </select>
              {errors.priority && (
                <p className="text-red-300 text-sm font-light mt-1">{errors.priority.message}</p>
              )}
              <p className="text-xs text-[#8B86B8] font-light opacity-75 mt-2">
                This helps us understand how much they mean to you (1 = most important)
              </p>
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-lg font-serif font-light text-[#6B5FA8] mb-3">
                What makes them special to you?
              </label>
              <Textarea
                id="description"
                placeholder="Share a cherished memory... their beautiful qualities... why they bring light to your life... what makes your heart smile when you think of them..."
                rows={4}
                {...register('description')}
                className={`rounded-2xl border-[#8B86B8]/30 focus:border-[#6B5FA8] bg-white/50 backdrop-blur-sm font-light ${errors.description ? 'border-red-300' : ''}`}
              />
              <div className="flex justify-between items-center mt-2">
                {errors.description && (
                  <p className="text-red-300 text-sm font-light">{errors.description.message}</p>
                )}
                <div className="text-xs text-[#8B86B8] font-light opacity-75">
                  {watchedDescription?.length || 0}/500 characters
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 rounded-2xl border-[#8B86B8]/30 text-[#8B86B8] hover:bg-white/30 hover:border-[#6B5FA8] font-light"
              >
                Maybe Later
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-2xl bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] hover:from-[#5A4F97] hover:to-[#7A75A7] text-white font-light shadow-lg"
              >
                <Heart className="w-4 h-4 mr-2" />
                {isLoading ? 'Welcoming them to your sanctuary...' : 'Welcome to My Circle'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Gentle Guidance */}
        <Card className="mt-8 p-6 bg-white/10 backdrop-blur-lg border-white/20 rounded-3xl">
          <h3 className="font-serif font-light text-[#6B5FA8] text-lg mb-4">Gentle reminders for your heart:</h3>
          <ul className="text-[#8B86B8] font-light space-y-2">
            <li>• Use whatever name feels most natural to you (Mom, Sarah, their nickname...)</li>
            <li>• Your relationship description can be as simple or detailed as you wish</li>
            <li>• Priority helps us understand their place in your heart - there&apos;s no wrong answer</li>
            <li>• Share what feels right in the description - a memory, a quality, or just how they make you feel</li>
            <li>• This is your sanctuary - honor your connections in whatever way feels authentic</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
