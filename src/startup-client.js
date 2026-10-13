// Client construction precedes React's error boundary. Keep platform/SDK
// failures on the existing retry screen without changing persisted sessions.
export function createStartupClient(sdk, url, key, options) {
  try {
    return sdk ? sdk.createClient(url, key, options) : null;
  } catch (_error) {
    console.error("PlushLife: account service could not initialize.");
    return null;
  }
}
