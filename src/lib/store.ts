// Custom SSE stream type
export type SSEStream = { write: (chunk: string) => void }

// sessionId -> PSID
type Mapping = { [sessionId: string]: string }

// sessionId -> set of SSE streams
type Streams = { [sessionId: string]: Set<SSEStream> }

export const psidBySession: Mapping = {}
export const streamsBySession: Streams = {}

// Add a new SSE stream
export function addStream(sessionId: string, stream: SSEStream) {
  if (!streamsBySession[sessionId]) streamsBySession[sessionId] = new Set()
  streamsBySession[sessionId].add(stream)
}

// Remove a SSE stream
export function removeStream(sessionId: string, stream: SSEStream) {
  streamsBySession[sessionId]?.delete(stream)
}

// Push payload to all SSE streams in a session
export function pushToSession(sessionId: string, payload: any) {
  const sinks = streamsBySession[sessionId]
  if (!sinks) return

  const data = `data: ${JSON.stringify(payload)}\n\n`

  Array.from(sinks).forEach((stream) => {
    try {
      stream.write(data)
    } catch {
      // Remove broken streams
      sinks.delete(stream)
    }
  })
}
