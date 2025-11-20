import axios from 'axios'
import { NextRequest } from 'next/server'
import { psidBySession } from '@/lib/store'

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN!

export async function POST(req: NextRequest) {
  try {
    const { text, sessionId } = await req.json()

    if (!text || !sessionId) {
      return new Response('Missing text or sessionId', { status: 400 })
    }

    const psid = psidBySession[sessionId]
    if (!psid) {
      // User hasn’t opened the Messenger thread yet
      return new Response(JSON.stringify({
        success: false,
        error: 'No PSID for this session. Ask user to click “Continue in Messenger” first.',
      }), { status: 400 })
    }

    const res = await axios.post(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: psid },
        message: { text },
      }
    )

    return new Response(JSON.stringify({ success: true, id: res.data?.message_id }), { status: 200 })
  } catch (err: any) {
    console.error('Send API error:', err?.response?.data || err?.message)
    return new Response('Failed to send message.', { status: 500 })
  }
}
