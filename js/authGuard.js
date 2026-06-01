import { supabase } from './supabaseClient.js'

const ADMIN_ROLES = ['super_admin', 'admin', 'editor', 'staff']

function primaryRole(roles) {
  const normalized = roles.map((role) => String(role).toLowerCase())
  return ADMIN_ROLES.find((role) => normalized.includes(role)) || (normalized.includes('buyer') ? 'buyer' : 'buyer')
}

export async function requireAuth(allowedRoles = []) {
  const { data } = await supabase.auth.getUser()
  const user = data?.user ?? null
  if (!user) {
    window.location.href = '/auth/login.html'
    return null
  }

  const roles = new Set()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.default_role) roles.add(profile.default_role)

  const { data: roleRows } = await supabase
    .from('user_role_assignments')
    .select('role')
    .eq('user_id', user.id)

  ;(roleRows || []).forEach((row) => {
    if (row.role) roles.add(row.role)
  })

  if (!roles.size) roles.add('buyer')
  const role = primaryRole(Array.from(roles))

  if (allowedRoles.length && !allowedRoles.map(String).map((item) => item.toLowerCase()).includes(role)) {
    window.location.href = ADMIN_ROLES.includes(role) ? '/admin/dashboard.html' : '/buyer-portal/dashboard.html'
    return null
  }

  return { user, profile, roles: Array.from(roles), role }
}
