import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications(passToken?: string) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null
    try {
      const reg = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready
      return reg
    } catch (err) {
      console.error("Erreur SW:", err)
      return null
    }
  }

  async function subscribe() {
    if (!passToken) return
    if (!VAPID_PUBLIC_KEY) {
      console.error("Clé VAPID publique manquante")
      return
    }
    const reg = await registerServiceWorker()
    if (!reg) return

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== "granted") return

      const existing = await reg.pushManager.getSubscription()
      const subscription = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const { error } = await supabase.rpc("save_push_subscription", {
        p_pass_token: passToken,
        p_subscription: subscription.toJSON(),
      })

      if (error) {
        console.error("Erreur sauvegarde:", error)
        return
      }

      setSubscribed(true)
    } catch (err) {
      console.error("Erreur subscribe:", err)
    }
  }

  return { permission, subscribed, subscribe }
}
