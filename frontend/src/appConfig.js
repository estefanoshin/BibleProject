const VERSION_DIRS = ['RV1960', 'RVA2015', 'DHH', 'NVI', 'KOERV']

function publicUrl(relativePath) {
  return new URL(relativePath, document.baseURI).href
}

export async function loadAppConfig() {
  const response = await fetch(publicUrl('config.json'))
  if (!response.ok) {
    return { offline: true, api_url: 'http://localhost:5010' }
  }
  const config = await response.json()
  return {
    offline: config.offline === true || config.offline === 'true',
    api_url: String(config.api_url ?? '').replace(/\/$/, ''),
  }
}

export { publicUrl, VERSION_DIRS }
