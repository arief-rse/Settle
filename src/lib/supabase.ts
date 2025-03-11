import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './api-config';

// Global Supabase client
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

// Function to generate a UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Function to generate a UUID from a string
function generateUUIDFromString(str: string): string {
  // Simple hash function for browser environments
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string and ensure it's the right length for a UUID
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hexHash}-${hexHash.substr(0, 4)}-${hexHash.substr(4, 4)}-${hexHash.substr(8, 4)}-${hexHash.substr(12)}`;
}

// Function to get or create a UUID for a user based on their email
export const getOrCreateUserUUID = async (email: string): Promise<string> => {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // Check if we already have a UUID for this email in profiles table
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return existingProfile.id;
    }

    // If no profile exists or there was an error (other than not found), create a new profile
    const newUUID = generateUUID();
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: newUUID,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating user profile:', insertError);
      throw insertError;
    }

    return newUUID;
  } catch (error) {
    console.error('Error in getOrCreateUserUUID:', error);
    // If all else fails, generate a UUID based on the email
    // This ensures we can still function even if database operations fail
    return generateUUIDFromString(email);
  }
};

// Function to get the Supabase client (initialize if needed)
export const getSupabaseClient = async () => {
  if (supabaseClient) return supabaseClient;
  return await initSupabase();
};

// Function to initialize the Supabase client
export const initSupabase = async () => {
  try {
    // Create the Supabase client with proper headers and auth
    supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    });
    
    console.log('Supabase client initialized with anon key');
    return supabaseClient;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return null;
  }
};

// User Profile Functions

/**
 * Create or update a user profile in the Supabase database
 */
export const createOrUpdateUserProfile = async (email: string) => {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // Get or create a UUID for this user
    const userUUID = await getOrCreateUserUUID(email);

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          last_login: new Date().toISOString(),
        })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userUUID, // Use the UUID here
          email: email,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_subscribed: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial request count for new user
      await createInitialRequestCount(userUUID);

      return data;
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

/**
 * Get a user profile from the Supabase database
 */
export const getUserProfile = async (email: string) => {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Request Count Functions

/**
 * Create initial request count record for a new user
 */
export const createInitialRequestCount = async (userUUID: string) => {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // Default to 5 free requests for new users
    const { data, error } = await supabase
      .from('request_counts')
      .insert({
        user_id: userUUID, // Use UUID here
        requests_remaining: 5,
        last_reset_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating initial request count:', error);
    throw error;
  }
};

/**
 * Get user request count from Supabase
 */
export const getUserRequestCount = async (email: string) => {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // Get the user's UUID first
    const userUUID = await getOrCreateUserUUID(email);
    
    // Query the request_counts table
    const { data, error } = await supabase
      .from('request_counts')
      .select('*')
      .eq('user_id', userUUID)
      .single();

    if (error) {
      // If no record exists, return null (will trigger creation of initial record)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching request count:', error);
    throw error;
  }
};

/**
 * Decrement user request count in Supabase
 */
export const decrementRequestCount = async (email: string) => {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // Get the user's UUID
    const userUUID = await getOrCreateUserUUID(email);
    
    // Get current request count
    const currentCount = await getUserRequestCount(email);
    
    // If no count record exists, create one with initial count
    if (!currentCount) {
      await createInitialRequestCount(userUUID);
      return;
    }
    
    // Calculate new count (don't go below 0)
    const newCount = Math.max(0, currentCount.requests_remaining - 1);
    
    // Update the record
    const { error } = await supabase
      .from('request_counts')
      .update({
        requests_remaining: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userUUID);

    if (error) throw error;
  } catch (error) {
    console.error('Error decrementing request count:', error);
    throw error;
  }
};

// Analysis History Functions

/**
 * Save analysis history to Supabase
 */
export const saveAnalysisHistory = async (
  email: string,
  text: string,
  response: string,
  url: string = ''
) => {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // Get the user's UUID
    const userUUID = await getOrCreateUserUUID(email);
    
    // Insert the analysis history record
    const { error } = await supabase
      .from('analysis_history')
      .insert({
        user_id: userUUID,
        text: text,
        response: response,
        url: url,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    
    console.log('Analysis history saved successfully');
  } catch (error) {
    console.error('Error saving analysis history:', error);
    throw error;
  }
};

/**
 * Get analysis history for a user
 */
export const getAnalysisHistory = async (email: string, limit = 20) => {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // First get the UUID for this email
    const userUUID = await getOrCreateUserUUID(email);
    
    const { data, error } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('user_id', userUUID)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting analysis history:', error);
    throw error;
  }
};

// Subscription Functions

/**
 * Get subscription status for a user
 */
export const getUserSubscription = async (email: string) => {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // First get the UUID for this email
    const userUUID = await getOrCreateUserUUID(email);
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userUUID)
      .single();

    if (error) {
      // If no subscription exists, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    throw error;
  }
};

/**
 * Update subscription status for a user
 */
export const updateUserSubscription = async (
  email: string,
  isSubscribed: boolean,
  subscriptionId: string | null = null
) => {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // First get the UUID for this email
    const userUUID = await getOrCreateUserUUID(email);
    
    // Check if subscription exists
    const existingSubscription = await getUserSubscription(email);
    
    if (existingSubscription) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          is_subscribed: isSubscribed,
          subscription_id: subscriptionId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userUUID)
        .select();

      if (error) throw error;
      return data;
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userUUID,
          is_subscribed: isSubscribed,
          subscription_id: subscriptionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
};
