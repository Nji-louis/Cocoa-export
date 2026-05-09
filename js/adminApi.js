import { supabase } from './supabaseClient.js'

const FUNCTIONS_BASE = (window.__SUPABASE_CONFIG__ && window.__SUPABASE_CONFIG__.functionsUrl) || '/.netlify/functions' // default placeholder

async function callFunction(path, body) {
  const tokenResp = await supabase.auth.getSession()
  const token = tokenResp?.data?.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch (e) { data = text }
  if (!res.ok) throw new Error(data?.message || text || 'Function error')
  return data
}

export function updateInquiryStatus(functionUrl, payload) {
  const url = functionUrl || `${FUNCTIONS_BASE}/update-inquiry-status`
  return callFunction(url, payload)
}

export function inviteUser(functionUrl, payload) {
  const url = functionUrl || `${FUNCTIONS_BASE}/invite-user`
  return callFunction(url, payload)
}

export default { updateInquiryStatus, inviteUser }
