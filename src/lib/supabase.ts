import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const checkAuth = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch (error) {
    return false
  }
}

export const signOut = async () => {
  await supabase.auth.signOut()
  chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') })
}
