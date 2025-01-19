import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Validate email format
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
const validatePassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
}

export const signInWithEmail = async (email: string, password: string) => {
  // Validate inputs
  if (!email || !password) {
    return { 
      data: null, 
      error: { 
        message: 'Email and password are required', 
        code: 'VALIDATION_ERROR' 
      } 
    };
  }

  if (!validateEmail(email)) {
    return { 
      data: null, 
      error: { 
        message: 'Invalid email format', 
        code: 'VALIDATION_ERROR' 
      } 
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase error codes to more user-friendly messages
      const errorMap: { [key: string]: string } = {
        'invalid_credentials': 'Invalid email or password',
        'user_not_found': 'No account found with this email',
        'invalid_email': 'Invalid email address',
        'user_disabled': 'This account has been disabled'
      };

      return { 
        data: null, 
        error: { 
          message: error.code && errorMap[error.code] ? errorMap[error.code] : (error.message || 'Sign in failed'), 
          code: error.code || 'SIGN_IN_ERROR' 
        } 
      };
    }

    return { data, error: null };
  } catch (err) {
    return { 
      data: null, 
      error: { 
        message: 'An unexpected error occurred during sign in', 
        code: 'UNEXPECTED_ERROR' 
      } 
    };
  }
}

export const signUpWithEmail = async (email: string, password: string) => {
  // Validate inputs
  if (!email || !password) {
    return { 
      data: null, 
      error: { 
        message: 'Email and password are required', 
        code: 'VALIDATION_ERROR',
        shouldNotify: true
      } 
    };
  }

  if (!validateEmail(email)) {
    return { 
      data: null, 
      error: { 
        message: 'Invalid email format', 
        code: 'VALIDATION_ERROR',
        shouldNotify: true
      } 
    };
  }

  if (!validatePassword(password)) {
    return { 
      data: null, 
      error: { 
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, and number', 
        code: 'VALIDATION_ERROR',
        shouldNotify: true
      } 
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      // Map Supabase error codes to more user-friendly messages
      const errorMap: { [key: string]: string } = {
        'user_already_exists': 'An account with this email already exists',
        'invalid_email': 'Invalid email address',
        'weak_password': 'Password is too weak'
      };

      return { 
        data: null, 
        error: { 
          message: error.code && errorMap[error.code] ? errorMap[error.code] : (error.message || 'Sign up failed'), 
          code: error.code || 'SIGN_UP_ERROR',
          shouldNotify: true
        } 
      };
    }

    // Check if user was created or just needs email confirmation
    if (data.user) {
      return { 
        data, 
        error: null,
        notification: {
          message: 'Account created successfully. Please check your email to confirm.',
          type: 'success',
          shouldNotify: true
        }
      };
    }

    return { data, error: null };
  } catch (err) {
    return { 
      data: null, 
      error: { 
        message: 'An unexpected error occurred during sign up', 
        code: 'UNEXPECTED_ERROR',
        shouldNotify: true
      } 
    };
  }
}

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Use the full URL for redirect
        redirectTo: `${window.location.origin}/auth/callback`,
        // Specify scopes for more comprehensive access
        scopes: 'openid profile email',
        // Optional: Add query parameters for additional configuration
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      // Detailed error mapping for Google Sign-In
      const errorMap: { [key: string]: string } = {
        'oauth_provider_error': 'Error connecting to Google. Please try again.',
        'oauth_cancelled': 'Google sign-in was cancelled.',
        'oauth_invalid_configuration': 'Invalid OAuth configuration. Contact support.',
        'oauth_unauthorized': 'Authorization failed. Please check your Google account.',
      };

      return { 
        data: null, 
        error: { 
          message: error.code && errorMap[error.code] 
            ? errorMap[error.code] 
            : (error.message || 'Google sign-in failed'), 
          code: error.code || 'GOOGLE_SIGN_IN_ERROR',
          shouldNotify: true
        } 
      };
    }

    return { 
      data, 
      error: null,
      notification: {
        message: 'Successfully signed in with Google',
        type: 'success',
        shouldNotify: true
      }
    };
  } catch (err) {
    return { 
      data: null, 
      error: { 
        message: 'An unexpected error occurred during Google sign-in', 
        code: 'UNEXPECTED_ERROR',
        shouldNotify: true
      } 
    };
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { 
        error: { 
          message: error.message || 'Sign out failed', 
          code: error.code || 'SIGN_OUT_ERROR' 
        } 
      };
    }

    return { error: null };
  } catch (err) {
    return { 
      error: { 
        message: 'An unexpected error occurred during sign out', 
        code: 'UNEXPECTED_ERROR' 
      } 
    };
  }
}

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return { 
        user: null, 
        error: { 
          message: error.message || 'Failed to retrieve current user', 
          code: error.code || 'GET_USER_ERROR' 
        } 
      };
    }

    return { user, error: null };
  } catch (err) {
    return { 
      user: null, 
      error: { 
        message: 'An unexpected error occurred while fetching user', 
        code: 'UNEXPECTED_ERROR' 
      } 
    };
  }
}

export const forgotPassword = async (email: string) => {
  // Validate email
  if (!email) {
    return { 
      data: null, 
      error: { 
        message: 'Email is required', 
        code: 'VALIDATION_ERROR',
        shouldNotify: true
      } 
    };
  }

  if (!validateEmail(email)) {
    return { 
      data: null, 
      error: { 
        message: 'Invalid email format', 
        code: 'VALIDATION_ERROR',
        shouldNotify: true
      } 
    };
  }

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      return { 
        data: null, 
        error: { 
          message: error.message || 'Failed to send password reset email', 
          code: error.code || 'PASSWORD_RESET_ERROR',
          shouldNotify: true
        } 
      };
    }

    return { 
      data, 
      error: null,
      notification: {
        message: 'Password reset email sent. Please check your inbox.',
        type: 'success',
        shouldNotify: true
      }
    };
  } catch (err) {
    return { 
      data: null, 
      error: { 
        message: 'An unexpected error occurred while resetting password', 
        code: 'UNEXPECTED_ERROR',
        shouldNotify: true
      } 
    };
  }
}

export const resetPassword = async (newPassword: string) => {
  // Validate new password
  if (!newPassword) {
    return { 
      data: null, 
      error: { 
        message: 'New password is required', 
        code: 'VALIDATION_ERROR',
        shouldNotify: true
      } 
    };
  }

  if (!validatePassword(newPassword)) {
    return { 
      data: null, 
      error: { 
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, and number', 
        code: 'VALIDATION_ERROR',
        shouldNotify: true
      } 
    };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { 
        data: null, 
        error: { 
          message: error.message || 'Failed to reset password', 
          code: error.code || 'PASSWORD_UPDATE_ERROR',
          shouldNotify: true
        } 
      };
    }

    return { 
      data, 
      error: null,
      notification: {
        message: 'Password successfully updated',
        type: 'success',
        shouldNotify: true
      }
    };
  } catch (err) {
    return { 
      data: null, 
      error: { 
        message: 'An unexpected error occurred while updating password', 
        code: 'UNEXPECTED_ERROR',
        shouldNotify: true
      } 
    };
  }
}

export const isAuthenticated = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return { 
        isLoggedIn: false, 
        error: { 
          message: 'No active session', 
          code: 'NO_SESSION',
          shouldNotify: true
        }
      };
    }

    return { 
      isLoggedIn: true, 
      user: session.user,
      error: null 
    };
  } catch (err) {
    return { 
      isLoggedIn: false, 
      error: { 
        message: 'An unexpected error occurred while checking authentication', 
        code: 'AUTHENTICATION_CHECK_ERROR',
        shouldNotify: true
      }
    };
  }
}

export const saveAnalysisHistory = async (analysisData: {
  text: string;
  response: string;
  timestamp: string;
}) => {
  // First, check if user is authenticated
  const authCheck = await isAuthenticated();
  
  if (!authCheck.isLoggedIn) {
    return {
      data: null,
      error: {
        message: 'You must be logged in to save analysis history',
        code: 'NOT_AUTHENTICATED',
        shouldNotify: true
      }
    };
  }

  try {
    // Save to Supabase user's history
    const { data, error } = await supabase
      .from('analysis_history')
      .insert({
        user_id: authCheck.user?.id,
        text: analysisData.text,
        response: analysisData.response,
        timestamp: analysisData.timestamp
      })
      .select();

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to save analysis history',
          code: 'HISTORY_SAVE_ERROR',
          shouldNotify: true
        }
      };
    }

    return { 
      data, 
      error: null,
      notification: {
        message: 'Analysis saved to history',
        type: 'success',
        shouldNotify: true
      }
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred while saving history',
        code: 'UNEXPECTED_ERROR',
        shouldNotify: true
      }
    };
  }
}

export const getAnalysisHistory = async () => {
  // First, check if user is authenticated
  const authCheck = await isAuthenticated();
  
  if (!authCheck.isLoggedIn) {
    return {
      data: null,
      error: {
        message: 'You must be logged in to view analysis history',
        code: 'NOT_AUTHENTICATED',
        shouldNotify: true
      }
    };
  }

  try {
    // Fetch user's history from Supabase
    const { data, error } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('user_id', authCheck.user?.id)
      .order('timestamp', { ascending: false });

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to retrieve analysis history',
          code: 'HISTORY_FETCH_ERROR',
          shouldNotify: true
        }
      };
    }

    return { 
      data, 
      error: null 
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred while fetching history',
        code: 'UNEXPECTED_ERROR',
        shouldNotify: true
      }
    };
  }
}
