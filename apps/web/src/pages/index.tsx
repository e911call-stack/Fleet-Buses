import Head from 'next/head';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Globe, Lock, Zap } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Globe,
      title: 'Real-time Tracking',
      description: 'See all buses on an interactive map with live GPS updates',
    },
    {
      icon: Lock,
      title: 'Secure QR Verification',
      description: 'Students board with dynamic QR codes for accountability',
    },
    {
      icon: Zap,
      title: 'Instant Notifications',
      description: 'Parents get WhatsApp alerts when children board the bus',
    },
  ];

  const pricing = [
    {
      name: 'Basic',
      price: '$29',
      period: '/month',
      buses: '2 buses',
      students: '50 students',
      features: [
        'Real-time tracking',
        'QR verification',
        'Basic reporting',
        'Email support',
      ],
      cta: 'Start Free Trial',
      variant: 'outline',
    },
    {
      name: 'Pro',
      price: '$79',
      period: '/month',
      buses: '10 buses',
      students: '300 students',
      features: [
        'Everything in Basic',
        'Advanced analytics',
        'WhatsApp integration',
        'API access',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      variant: 'primary',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      buses: 'Unlimited buses',
      students: 'Unlimited students',
      features: [
        'Everything in Pro',
        'Custom features',
        'Dedicated support',
        'SLA guarantee',
      ],
      cta: 'Contact Sales',
      variant: 'outline',
    },
  ];

  return (
    <>
      <Head>
        <title>FleetGuard - School Bus Fleet Management SaaS</title>
        <meta name="description" content="Real-time student safety and fleet tracking for school transportation" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold text-primary">🚌 FleetGuard</div>
            <div className="space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn btn-primary">
                Get Started Free
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
              Real-time Student Safety
              <span className="block text-primary">Zero Complexity</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Track school buses in real-time. Keep parents informed. Reduce liability.
              All in one dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register" className="btn btn-primary btn-lg">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="btn btn-outline btn-lg">
                Schedule Demo
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">No credit card required. 14-day free trial.</p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Schools Choose FleetGuard</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="p-6 border border-gray-200 rounded-lg hover:border-primary transition">
                    <Icon className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {pricing.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-lg p-8 ${
                    plan.highlighted
                      ? 'border-2 border-primary bg-white shadow-xl scale-105'
                      : 'border border-gray-200 bg-white'
                  }`}
                >
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-6">
                    <p>{plan.buses}</p>
                    <p>{plan.students}</p>
                  </div>
                  <button className={`btn ${plan.variant === 'primary' ? 'btn-primary' : 'btn-outline'} w-full mb-6`}>
                    {plan.cta}
                  </button>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Fleet?</h2>
          <p className="text-lg mb-8 opacity-90">Join schools across Jordan and the Middle East already using FleetGuard</p>
          <Link href="/auth/register" className="btn bg-white text-primary hover:bg-gray-100">
            Get Started Free (14 Days)
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="text-gray-600">© 2025 FleetGuard. All rights reserved.</div>
            <div className="space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-900">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Terms</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
