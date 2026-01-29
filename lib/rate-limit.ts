// Simple in-memory rate limiter
type RateLimitStore = Map<string, number[]>

export function createRateLimiter(limit: number, windowMs: number) {
  const requests: RateLimitStore = new Map()

  // Cleanup old entries every 5 minutes
  setInterval(() => {
    const now = Date.now()
    for (const [key, timestamps] of requests.entries()) {
      const recent = timestamps.filter(time => now - time < windowMs)
      if (recent.length === 0) {
        requests.delete(key)
      } else {
        requests.set(key, recent)
      }
    }
  }, 5 * 60 * 1000)

  return {
    check: (identifier: string): boolean => {
      const now = Date.now()
      const userRequests = requests.get(identifier) || []
      
      // Filter out requests outside the time window
      const recentRequests = userRequests.filter(time => now - time < windowMs)
      
      if (recentRequests.length >= limit) {
        return false // Rate limit exceeded
      }
      
      recentRequests.push(now)
      requests.set(identifier, recentRequests)
      return true // Request allowed
    },
    
    remaining: (identifier: string): number => {
      const now = Date.now()
      const userRequests = requests.get(identifier) || []
      const recentRequests = userRequests.filter(time => now - time < windowMs)
      return Math.max(0, limit - recentRequests.length)
    }
  }
}

// Helper to get client IP from request
export function getClientIp(request: Request): string {
  // Try to get real IP from headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  // Fallback
  return 'unknown'
}

// Sanitize content to prevent XSS
export function sanitizeContent(content: string): string {
  // Remove HTML tags
  return content.replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 500) // Max 500 chars
}
