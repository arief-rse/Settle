import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, LineChart } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  const features = [
    {
      name: 'Smart Selection',
      description: 'Select text from any webpage using our intuitive rectangle selection tool.',
      icon: Sparkles,
    },
    {
      name: 'Instant Analysis',
      description: 'Get immediate AI-powered insights and analysis from your selected text.',
      icon: Zap,
    },
    {
      name: 'Secure & Private',
      description: 'Your data is encrypted and never stored without your permission.',
      icon: Shield,
    },
    {
      name: 'Analytics',
      description: 'Track your usage and get insights into your content analysis patterns.',
      icon: LineChart,
    },
  ];

  return (
    <div className="relative min-h-screen bg-gray-950">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
      </div>

      {/* Minimal grid pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="h-full w-full bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-gray-950/50 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  <span className="text-2xl font-bold text-white flex items-baseline gap-2">
                    Settle <span className="text-sm font-normal text-gray-400">by <span className="text-blue-400 font-medium">&lt;b/io&gt;</span></span>
                  </span>
                </Link>
              </div>
              <div className="flex items-center gap-6">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/signup"
                      className="inline-flex items-center rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="pt-32 pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div 
              className="mx-auto max-w-3xl text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Extract insights from any webpage with AI
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-400">
                Settle is a powerful Chrome extension that helps you analyze and extract meaningful insights from any text on the web using advanced AI.
              </p>
              <div className="mt-10 flex items-center justify-center gap-6">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      Get started for free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                      to="/pricing"
                      className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      View pricing <span aria-hidden="true">→</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>

            {/* Features Section */}
            <motion.div 
              className="mx-auto mt-32 max-w-7xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Everything you need to analyze content
                </h2>
                <p className="mt-4 text-lg leading-8 text-gray-400">
                  Settle comes packed with features that help you extract, analyze, and understand content from any webpage.
                </p>
              </div>
              <div className="mx-auto mt-16 max-w-2xl lg:max-w-none">
                <dl className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  {features.map((feature) => (
                    <motion.div 
                      key={feature.name}
                      className="relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 p-8"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <dt className="flex items-center gap-3 text-lg font-medium text-white">
                        <feature.icon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
                        {feature.name}
                      </dt>
                      <dd className="mt-4 text-base text-gray-400">
                        {feature.description}
                      </dd>
                    </motion.div>
                  ))}
                </dl>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 