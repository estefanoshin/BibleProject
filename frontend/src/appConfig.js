const VERSION_DIRS = ['RV1960', 'RVA2015', 'DHH', 'NVI', 'KOERV', 'KJV', 'KLB', 'NLT', 'NTV']

let cachedConfig

function publicUrl(relativePath) {
  return new URL(relativePath, document.baseURI).href
}

export async function loadAppConfig() {
  if (cachedConfig) {
    return cachedConfig
  }
  const response = await fetch(publicUrl('config.json'))
  if (!response.ok) {
    cachedConfig = { offline: true, api_url: 'http://localhost:5010' }
    return cachedConfig
  }
  const config = await response.json()
  cachedConfig = {
    offline: config.offline === true || config.offline === 'true',
    api_url: String(config.api_url ?? '').replace(/\/$/, ''),
  }
  return cachedConfig
}

export async function usesRemoteStorage() {
  const config = await loadAppConfig()
  return !config.offline
}

export { publicUrl, VERSION_DIRS }
