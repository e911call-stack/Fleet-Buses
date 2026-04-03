import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase-client';
import { Eye, EyeOff, Bus, ArrowRight, CheckCircle } from 'lucide-react';

const registerSchema = z.object({
  schoolName: z.string().min(3, 'School name must be at least 3 characters'),
  slug: z
    .string()
    .min(3, 'URL slug must be at least 3 characters')
    .max(30, 'Slug must be 30 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  plan: z.enum(['basic', 'pro', 'enterprise']),
});

type RegisterForm = z.infer<typeof registerSchema>;

const plans = [
  {
    id: 'basic' as const,
    name: 'Basic',
    price: '$29/mo',
    desc: 'Up to 2 buses · 50 students',
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$79/mo',
    desc: '10 buses · 300 students',
    highlight: true,
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: 'Custom',
    desc: 'Unlimited · White-label',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { plan: 'pro' },
  });

  const selectedPlan = watch('plan');
  const schoolName = watch('schoolName');

  // Auto-generate slug from school name
  const handleSchoolNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('schoolName', val);
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);
    setValue('slug', slug);
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // 1. Create Supabase auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.fullName },
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      if (!authData.user) {
        toast.error('Failed to create account. Please try again.');
        return;
      }

      // 2. Create tenant record
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.schoolName,
          slug: data.slug,
          plan: data.plan,
          subscription_status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .select()
        .single();

      if (tenantError) {
        if (tenantError.code === '23505') {
          toast.error('That URL slug is already taken. Please choose another.');
        } else {
          toast.error('Failed to create your school account. ' + tenantError.message);
        }
        return;
      }

      // 3. Create admin profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        email: data.email,
        full_name: data.fullName,
        role: 'admin',
        is_active: true,
      });

      if (profileError) {
        toast.error('Account created but profile setup failed. Please contact support.');
        return;
      }

      toast.success('🎉 School registered! Redirecting to your dashboard…');
      setTimeout(() => {
        router.push(`/${data.slug}/dashboard`);
      }, 1200);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Get Started Free – FleetGuard</title>
        <meta name="description" content="Register your school on FleetGuard – 14-day free trial, no credit card required." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 p-6">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Bus className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">FleetGuard</span>
          </Link>
        </div>

        <div className="flex flex-col items-center px-4 py-20">
          {/* Heading */}
          <div className="text-center mb-8 mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Start your free trial</h1>
            <p className="text-gray-500 mt-2">14 days free · No credit card required</p>
          </div>

          {/* Card */}
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Plan selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select your plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setValue('plan', plan.id)}
                      className={`relative rounded-xl p-3 text-left border-2 transition ${
                        selectedPlan === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {plan.highlight && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          POPULAR
                        </span>
                      )}
                      <div className="font-semibold text-sm text-gray-900">{plan.name}</div>
                      <div className="text-xs font-bold text-blue-600 mt-0.5">{plan.price}</div>
                      <div className="text-[10px] text-gray-500 mt-1 leading-tight">{plan.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* School name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  School / Organisation name
                </label>
                <input
                  type="text"
                  placeholder="Al-Iman International School"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.schoolName ? 'border-red-400' : 'border-gray-200'
                  }`}
                  {...register('schoolName')}
                  onChange={handleSchoolNameChange}
                />
                {errors.schoolName && (
                  <p className="text-xs text-red-500 mt-1">{errors.schoolName.message}</p>
                )}
              </div>

              {/* URL slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Dashboard URL
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
                  <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-100 border-r border-gray-200 shrink-0">
                    fleetguard.app/
                  </span>
                  <input
                    type="text"
                    placeholder="my-school"
                    className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none border-none"
                    {...register('slug')}
                  />
                </div>
                {errors.slug && (
                  <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>
                )}
              </div>

              {/* Full name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your full name
                </label>
                <input
                  type="text"
                  placeholder="Ahmed Al-Hassan"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fullName ? 'border-red-400' : 'border-gray-200'
                  }`}
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Work email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="admin@school.edu"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-400' : 'border-gray-200'
                  }`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-400' : 'border-gray-200'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition text-sm mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Creating your account…
                  </>
                ) : (
                  <>
                    Start 14-day free trial <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 pt-1">
                {['No credit card', '14 days free', 'Cancel anytime'].map((t) => (
                  <div key={t} className="flex items-center gap-1 text-xs text-gray-500">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {t}
                  </div>
                ))}
              </div>
            </form>
          </div>

          {/* Sign in link */}
          <p className="text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-xs text-gray-400 mt-4">
            © 2025 FleetGuard · Keeping students safe
          </p>
        </div>
      </div>
    </>
  );
}
