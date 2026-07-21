import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const VAPID_PUBLIC_KEY = "BJLiSBntvogSPLMEKPK5oRjrS9R0USPG3OzLO-8yWyHV5g0pkuBfr_9yem24IrQNm6HGC6tukDsbQy5tC3XDotA"

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

export function usePushNotifications(playerId?: string) {
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
      console.error("Erreur enregistrement SW:", err)
      return null
    }
  }

  async function subscribe() {
    if (!playerId) return

    const reg = await registerServiceWorker()
    if (!reg) return

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== "granted") return

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const { error } = await supabase.from("push_subscriptions").upsert({
        player_id: playerId,
        subscription: JSON.stringify(subscription),
        created_at: new Date().toISOString(),
      }, { onConflict: "player_id" })

      if (error) {
        console.error("Erreur sauvegarde en base:", error)
        return
      }

      setSubscribed(true)
    } catch (err) {
      console.error("Erreur subscribe:", err)
    }
  }

  return { permission, subscribed, subscribe }
}
