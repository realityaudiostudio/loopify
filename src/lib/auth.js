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

export async function fetchAdminProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function saveProduct(payload) {
  if (payload.id) {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: payload.name,
        description: payload.description,
        daily_price: payload.daily_price,
        total_quantity: payload.total_quantity,
        available_quantity: payload.available_quantity,
        pickup_location: payload.pickup_location,
        image_url: payload.image_url,
        is_active: payload.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.id)
      .select()
      .single()
    return { data, error }
  }

  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        name: payload.name,
        description: payload.description,
        daily_price: payload.daily_price,
        total_quantity: payload.total_quantity,
        available_quantity: payload.available_quantity,
        pickup_location: payload.pickup_location,
        image_url: payload.image_url,
        is_active: payload.is_active,
      },
    ])
    .select()
    .single()
  return { data, error }
}

export async function toggleProductStatus(productId, isActive) {
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .select()
    .single()
  return { data, error }
}
