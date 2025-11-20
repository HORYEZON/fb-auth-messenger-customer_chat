import axios from 'axios'
import { NextRequest } from 'next/server'
import { psidBySession, pushToSession } from '@/lib/store'

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN!
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN!

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified')
    return new Response(challenge, { status: 200 })
  }
  console.warn('❌ Webhook verification failed')
  return new Response('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {

  try {
    const body = await req.json()
    if (body.object !== 'page') return new Response('Not Found', { status: 404 })

    for (const entry of body.entry) {
      const event = entry.messaging[0]
      console.log('📩 Incoming webhook event:', JSON.stringify(event, null, 2))

      const senderPsid = event.sender?.id
      const referral = event.referral || event.postback?.referral
      const refSession = referral?.ref

      // Map sessionId to PSID upon first contact
      if (refSession && senderPsid) {
        psidBySession[refSession] = senderPsid
        console.log(`🔗 Mapped session ${refSession} → PSID ${senderPsid}`)
      } else {
        console.log('ℹ️ No referral.ref found, cannot map sessionId yet')
      }

      // Forward Page replies to the website stream
      if (event.message?.text) {
        const sessionId = Object.keys(psidBySession).find(
          sid => psidBySession[sid] === senderPsid
        )
        if (sessionId) {
          pushToSession(sessionId, { text: event.message.text })
          console.log(`➡️ Pushed reply to session ${sessionId}`)
        } else {
          console.log('⚠️ Received message but no session mapping for PSID', senderPsid)
        }
      }

      // Optional auto-reply for testing
      if (event.message?.text && senderPsid) {
        await axios.post(
          `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
          {
            recipient: { id: senderPsid },
            message: { text: `Received: "${event.message.text}"` },
          }
        )
      }
    }

    return new Response('EVENT_RECEIVED', { status: 200 })
  } catch (err: any) {
    console.error('Webhook error:', err?.response?.data || err?.message)
    return new Response('Internal Server Error', { status: 500 })
  }
}
