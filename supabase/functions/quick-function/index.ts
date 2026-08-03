import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const auth = request.headers.get('Authorization')
    if (!auth) throw new Error('Non authentifié')
    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) throw new Error('Non authentifié')
    const admin = createClient(url, serviceKey)
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('Accès refusé')

    const { title, message, url: targetUrl } = await request.json()
    if (typeof title !== 'string' || typeof message !== 'string') throw new Error('Notification invalide')
    webpush.setVapidDetails(
      'mailto:magasin@3sets.fr',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!,
    )
    const { data: subscriptions } = await admin.from('push_subscriptions').select('id,subscription')
    let sent = 0
    for (const row of subscriptions || []) {
      try {
        await webpush.sendNotification(row.subscription, JSON.stringify({ title, message, url: targetUrl || '/' }))
        sent++
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', row.id)
        }
      }
    }
    return Response.json({ sent, total: subscriptions?.length || 0 }, { headers: cors })
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Erreur serveur' }, { status: 400, headers: cors })
  }
})
