import React from 'react';
import { useAuth } from '../lib/auth';
import { createPortalSession } from '../lib/stripe';

export default function Dashboard() {
  const { userData } = useAuth();

  const handleManageSubscription = async () => {
    if (!userData?.customerId) return;
    try {
      await createPortalSession(userData.customerId);
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="mt-4 sm:mt-0">
            {userData?.isSubscribed ? (
              <button
                onClick={handleManageSubscription}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Manage Subscription
              </button>
            ) : (
              <a
                href="/pricing"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Upgrade to Premium
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Usage Statistics
              </h3>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Subscription Status */}
                <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Subscription Status
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {userData?.isSubscribed ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-yellow-600">Free</span>
                      )}
                    </dd>
                  </div>
                </div>

                {/* Remaining Requests */}
                {!userData?.isSubscribed && (
                  <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Remaining Requests
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {userData?.remainingRequests}
                      </dd>
                    </div>
                  </div>
                )}

                {/* Account Created */}
                <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Account Created
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {userData?.createdAt
                        ? new Date(userData.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Available Features
              </h3>
              <div className="mt-5">
                <ul className="divide-y divide-gray-200">
                  <li className="py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        Rectangle Selection
                      </span>
                    </div>
                    <span className="text-sm text-green-600">Available</span>
                  </li>
                  <li className="py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        Unlimited Requests
                      </span>
                    </div>
                    {userData?.isSubscribed ? (
                      <span className="text-sm text-green-600">Available</span>
                    ) : (
                      <span className="text-sm text-gray-500">Premium Only</span>
                    )}
                  </li>
                  <li className="py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        Priority Support
                      </span>
                    </div>
                    {userData?.isSubscribed ? (
                      <span className="text-sm text-green-600">Available</span>
                    ) : (
                      <span className="text-sm text-gray-500">Premium Only</span>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 