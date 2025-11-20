import { NextRequest } from 'next/server'
import { addStream, removeStream, SSEStream } from '@/lib/store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) return new Response('Missing sessionId', { status: 400 })

  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  }

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const res: SSEStream = {
    write: (chunk: string) => writer.write(new TextEncoder().encode(chunk)),
  }

  addStream(sessionId, res)

  const initial = `data: ${JSON.stringify({ text: '🔌 Connected to updates.' })}\n\n`
  await writer.write(new TextEncoder().encode(initial))

  const close = () => {
    removeStream(sessionId, res)
    writer.close()
  }

  return new Response(stream.readable, { headers })
}
