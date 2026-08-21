/**
 * Safely parse JSON responses from fetch requests.
 * Handles HTML error pages gracefully to prevent "Unexpected token" JSON parse crashes.
 */
export async function safeFetchJSON<T = any>(res: Response, fallback?: T): Promise<T> {
  const text = await res.text();
  
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const json = JSON.parse(text);
      if (json.error) errorMsg = json.error;
    } catch (e) {
      if (text.startsWith('<') || text.toLowerCase().includes('html')) {
        errorMsg = `API Route Not Found or Server Exception (${res.status})`;
      } else {
        errorMsg = text.slice(0, 100);
      }
    }
    throw new Error(errorMsg);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Invalid JSON format returned from server: ${text.slice(0, 80)}`);
  }
}
