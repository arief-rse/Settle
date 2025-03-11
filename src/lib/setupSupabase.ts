/**
 * Utility functions to set up Supabase credentials in Chrome storage
 */

/**
 * Initialize Supabase credentials in Chrome storage
 * @param supabaseUrl Your Supabase project URL
 * @param supabaseAnonKey Your Supabase anonymous key
 */
export const initializeSupabaseCredentials = (
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      reject(new Error('Supabase URL and anon key are required'));
      return;
    }

    chrome.storage.local.set(
      { supabaseUrl, supabaseAnonKey },
      () => {
        if (chrome.runtime.lastError) {
          console.error('Error storing Supabase credentials:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('Supabase credentials stored successfully');
          resolve();
        }
      }
    );
  });
};

/**
 * Get stored Supabase credentials from Chrome storage
 */
export const getStoredSupabaseCredentials = (): Promise<{
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
}> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['supabaseUrl', 'supabaseAnonKey'], (result) => {
      resolve({
        supabaseUrl: result.supabaseUrl || null,
        supabaseAnonKey: result.supabaseAnonKey || null
      });
    });
  });
};

/**
 * Clear Supabase credentials from Chrome storage
 */
export const clearSupabaseCredentials = (): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['supabaseUrl', 'supabaseAnonKey'], () => {
      console.log('Supabase credentials cleared');
      resolve();
    });
  });
};
