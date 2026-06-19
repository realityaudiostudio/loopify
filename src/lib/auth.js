import { supabase } from './supabase'

/** Sign up a new student */
export async function signUp({ fullName, email, phone, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone_number: phone },
      emailRedirectTo: `${window.location.origin}/verify`,
    },
  })
  return { data, error }
}

/** Log in existing user */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

/** Log out */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/** Fetch the profile row for a given user id */
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

/** Update the profile row */
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}
