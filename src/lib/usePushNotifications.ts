import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const rawData = window.atob((base64String + padding).replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0))
}

function detectIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function detectStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

export function usePushNotifications(passToken?: string) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isIos] = useState(detectIos)
  const [isStandalone] = useState(detectStandalone)
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null
    const registration = await navigator.serviceWorker.register("/sw.js")
    await navigator.serviceWorker.ready
    return registration
  }

  async function saveSubscription(subscription: PushSubscription) {
    if (!passToken) return false
    const { error: saveError } = await supabase.rpc("save_push_subscription", {
      p_pass_token: passToken,
      p_subscription: subscription.toJSON(),
    })
    if (saveError) throw saveError
    return true
  }

  useEffect(() => {
    if (!supported || !passToken) return
    setPermission(Notification.permission)
    if (Notification.permission !== "granted") return
    registerServiceWorker()
      .then((registration) => registration?.pushManager.getSubscription())
      .then(async (subscription) => {
        if (subscription && await saveSubscription(subscription)) setSubscribed(true)
      })
      .catch(() => setError("Impossible de vérifier l’abonnement aux notifications."))
  }, [passToken])

  async function subscribe() {
    setError(null)
    if (!passToken) return false
    if (isIos && !isStandalone) {
      setError("Sur iPhone, ajoute d’abord le Club Pass à l’écran d’accueil, puis ouvre-le depuis son icône.")
      return false
    }
    if (!supported) {
      setError("Les notifications ne sont pas disponibles dans ce navigateur.")
      return false
    }
    if (!VAPID_PUBLIC_KEY) {
      setError("La configuration des notifications est incomplète.")
      return false
    }
    setBusy(true)
    try {
      const registration = await registerServiceWorker()
      if (!registration) throw new Error("Service worker indisponible")
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== "granted") {
        setError("Les notifications ont été refusées. Tu peux les autoriser dans les réglages de l’iPhone.")
        return false
      }
      const existing = await registration.pushManager.getSubscription()
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await saveSubscription(subscription)
      setSubscribed(true)
      return true
    } catch {
      setError("L’activation a échoué. Ferme puis rouvre l’app et réessaie.")
      return false
    } finally {
      setBusy(false)
    }
  }

  return { permission, subscribed, busy, error, isIos, isStandalone, supported, subscribe }
}
