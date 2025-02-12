import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Clock, 
  Settings, 
  CreditCard, 
  ArrowUpRight, 
  Zap,
  History,
  RefreshCw
} from 'lucide-react';

interface UserSubscription {
  status: 'active' | 'inactive' | 'past_due';
  plan: string;
  currentPeriodEnd?: string;
  usageCount: number;
  maxUsage: number;
}

interface AnalysisHistory {
  id: string;
  timestamp: number;
  text: string;
  result: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSubscription(data.subscription || { 
          status: 'inactive', 
          plan: 'free',
          usageCount: 0,
          maxUsage: 5
        });
      }
      setLoading(false);
    });

    // Fetch analysis history
    const historyUnsubscribe = onSnapshot(
      doc(db, 'users', user.uid, 'history', 'analyses'),
      (doc) => {
        if (doc.exists()) {
          setHistory(doc.data().items || []);
        }
      }
    );

    return () => {
      unsubscribe();
      historyUnsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

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

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
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
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 pt-32">
        {/* Welcome Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.email?.split('@')[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Here's what's happening with your account
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Usage Card */}
          <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    AI Analyses Used
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {(subscription?.usageCount || 0)} / {(subscription?.maxUsage || 5)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-blue-400">
                      <ArrowUpRight className="self-center flex-shrink-0 h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Usage</span>
                      {Math.round(((subscription?.usageCount || 0) / (subscription?.maxUsage || 5)) * 100)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-6">
              <Link
                to="/pricing"
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Upgrade for more analyses →
              </Link>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Current Plan
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {(subscription?.plan || 'Free').charAt(0).toUpperCase() + (subscription?.plan || 'Free').slice(1)}
                    </div>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (subscription?.status || 'inactive') === 'active' ? 'bg-blue-400/10 text-blue-400' : 
                      (subscription?.status || 'inactive') === 'past_due' ? 'bg-yellow-400/10 text-yellow-400' : 
                      'bg-gray-400/10 text-gray-400'
                    }`}>
                      {(subscription?.status || 'inactive').charAt(0).toUpperCase() + (subscription?.status || 'inactive').slice(1)}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-6">
              <Link
                to="/pricing"
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all plans →
              </Link>
            </div>
          </div>

          {/* Settings Card */}
          <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Account Settings
                  </dt>
                  <dd className="mt-1 text-sm text-gray-300">
                    Manage your account preferences and settings
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-6">
              <Link
                to="/settings"
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                View settings →
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-lg font-medium text-white mb-4">Recent Activity</h2>
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-xl divide-y divide-gray-800">
            {history.length > 0 ? (
              <ul role="list" className="divide-y divide-gray-800">
                {history.map((item) => (
                  <li key={item.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <History className="h-5 w-5 text-blue-400" />
                        <p className="ml-2 text-sm font-medium text-white truncate max-w-md">
                          {item.text}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-400/10 text-blue-400">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-400">
                        {item.result}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <History className="mx-auto h-12 w-12 text-gray-600" />
                <h3 className="mt-2 text-sm font-medium text-white">No activity yet</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Start analyzing text to see your activity here.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Background gradient effect */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#0ea5e9] to-[#2563eb] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" 
          style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
      </div>
    </div>
  );
}