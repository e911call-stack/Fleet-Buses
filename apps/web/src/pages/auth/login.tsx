import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase-client';
import { Eye, EyeOff, Bus, ArrowRight, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message || 'Invalid email or password');
        return;
      }

      if (authData.user) {
        // Fetch user profile to determine redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, tenant_id')
          .eq('id', authData.user.id)
          .single();

        if (profile?.role === 'super_admin') {
          router.push('/super-admin');
          return;
        }

        // Fetch tenant slug for redirect
        if (profile?.tenant_id) {
          const { data: tenant } = await supabase
            .from('tenants')
            .select('slug')
            .eq('id', profile.tenant_id)
            .single();

          if (tenant?.slug) {
            toast.success('Welcome back!');
            router.push(`/${tenant.slug}/dashboard`);
            return;
          }
        }

        toast.success('Logged in successfully');
        router.push('/');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In – FleetGuard</title>
        <meta name="description" content="Sign in to your FleetGuard account" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center">
        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 p-6">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Bus className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">FleetGuard</span>
          </Link>
        </div>

        <div className="flex flex-col items-center px-4 py-16">
          {/* Card */}
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
                <Bus className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-sm text-gray-500 mt-1">Sign in to your FleetGuard account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                  }`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => toast('Password reset coming soon')}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
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
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition text-sm"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <hr className="flex-1 border-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <hr className="flex-1 border-gray-200" />
            </div>

            {/* Super Admin hint */}
            <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
              <ShieldCheck className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-indigo-800">Super Admin Access</p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  Use the credentials provided by your platform administrator to access the Super Admin panel.
                </p>
              </div>
            </div>

            {/* Sign up link */}
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">
                Get started free
              </Link>
            </p>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            © 2025 FleetGuard · Keeping students safe
          </p>
        </div>
      </div>
    </>
  );
}
