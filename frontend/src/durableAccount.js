import { Capacitor } from '@capacitor/core'
import { CapacitorPersistentAccount } from '@capgo/capacitor-persistent-account'

let persistChain = Promise.resolve()
let durable = {}
let hydrated = false

function unwrap(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }
  // Web implementation of the plugin stores the whole { data } options object.
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && raw.readChapters == null) {
    return unwrap(raw.data)
  }
  return raw
}

export async function hydrateDurable() {
  if (hydrated) {
    return durable
  }
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await CapacitorPersistentAccount.readAccount()
      durable = unwrap(result?.data)
    } catch {
      durable = {}
    }
  }
  hydrated = true
  return durable
}

export function persistDurable(patch) {
  durable = { ...durable, ...patch }
  if (!Capacitor.isNativePlatform()) {
    return persistChain
  }
  persistChain = persistChain
    .then(() => CapacitorPersistentAccount.saveAccount({ data: durable }))
    .catch(() => {})
  return persistChain
}
