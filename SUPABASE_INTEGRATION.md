# Supabase Integration Guide

This document outlines how the Settle extension integrates with Supabase for database operations.

## Overview

The Settle extension uses Supabase as its backend database to store and manage:
- User profiles
- Request counts
- Analysis history
- Subscription information

## Database Schema

The Supabase database includes the following tables:

### profiles
Stores user profile information:
- `id`: User ID (primary key, matches email)
- `created_at`: Timestamp when profile was created
- `request_count`: Number of requests used (legacy field)
- `is_subscribed`: Boolean indicating subscription status
- `subscription_end_date`: Date when subscription ends
- `email`: User's email address

### request_counts
Tracks remaining API requests per user:
- `id`: Record ID
- `user_id`: User ID (foreign key to profiles)
- `requests_remaining`: Number of remaining requests
- `last_reset_at`: Timestamp of last reset
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### analysis_history
Stores history of text analyses:
- `id`: Record ID
- `user_id`: User ID (foreign key to profiles)
- `timestamp`: When analysis was performed
- `text`: Original text that was analyzed
- `response`: AI response/analysis
- `url`: URL where the text was analyzed (optional)

### user_subscriptions
Contains subscription details for users:
- `id`: Record ID
- `user_id`: User ID (foreign key to profiles)
- `is_subscribed`: Subscription status
- `requests_count`: Used requests (optional)
- `requests_limit`: Maximum requests allowed (optional)
- `subscription_id`: ID of subscription (optional)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### subscriptions, products, prices
Store Stripe subscription, product, and pricing information.

## Setup Instructions

### 1. Create a Supabase Project

1. Sign up at [Supabase](https://supabase.com/) and create a new project
2. Note your project URL and anon key (public API key)

### 2. Set Up Database Tables

Execute the following SQL in the Supabase SQL editor to create the necessary tables:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    request_count INTEGER DEFAULT 5,
    is_subscribed BOOLEAN DEFAULT false,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    email TEXT
);

-- Create request_counts table
CREATE TABLE public.request_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) NOT NULL,
    requests_remaining INTEGER DEFAULT 5,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create analysis_history table
CREATE TABLE public.analysis_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    text TEXT NOT NULL,
    response TEXT NOT NULL,
    url TEXT
);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) NOT NULL,
    is_subscribed BOOLEAN DEFAULT false,
    requests_count INTEGER,
    requests_limit INTEGER,
    subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3. Configure Row-Level Security (RLS)

Set up RLS policies to secure your data:

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles: Users can only read/write their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Similar policies for other tables
-- ...
```

### 4. Configure Extension

1. In your extension, store the Supabase URL and anon key in Chrome's local storage:

```javascript
chrome.storage.local.set({
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
});
```

2. The extension will automatically initialize the Supabase client using these values.

## Integration Points

The Supabase integration interacts with the extension at these key points:

1. **Authentication**: After successful Google authentication, the user profile is created or updated in Supabase.

2. **Request Counting**: Before processing text with the AI, the system checks if the user has remaining requests. After processing, it decrements the request count.

3. **Analysis History**: When text is analyzed, the result is saved to both local storage and Supabase (if the user is authenticated).

4. **User Menu**: The remaining request count displayed in the user menu is fetched from Supabase.

## Troubleshooting

- If database operations fail, the extension will continue to function using local storage as a fallback.
- Check the console logs for detailed error messages related to Supabase operations.
- Ensure your Supabase project is active and the API is accessible.
