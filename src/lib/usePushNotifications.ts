import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM92c3BxBDTHEDL4W8hsLh2i0E3f_JdEoT1_CkxKOr1a4xMYHk4Bg0"

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
  const [permission, setPermission] = useState("default")
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
      return reg
    } catch (err) {
      console.error("SW registration failed:", err)
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

      await supabase.from("push_subscriptions").upsert({
        player_id: playerId,
        subscription: JSON.stringify(subscription),
        created_at: new Date().toISOString(),
      }, { onConflict: "player_id" })

      setSubscribed(true)
    } catch (err) {
      console.error("Push subscription failed:", err)
    }
  }

  return { permission, subscribed, subscribe }
}
