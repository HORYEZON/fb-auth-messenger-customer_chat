import axios from 'axios'

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN

// ✅ GET = Facebook verifying the webhook
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WEBHOOK VERIFIED')
    return new Response(challenge, { status: 200 })
  } else {
    return new Response('Forbidden', { status: 403 })
  }
}

// ✅ POST = Facebook sending messages/events
export async function POST(req) {
  const body = await req.json()

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging?.[0]
      console.log('📩 Message received:', webhookEvent)

      const senderPsid = webhookEvent.sender?.id

      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message)
      }
    })

    return new Response('EVENT_RECEIVED', { status: 200 })
  } else {
    return new Response('Not Found', { status: 404 })
  }
}

async function handleMessage(senderPsid, receivedMessage) {
  let response
  if (receivedMessage.text) {
    response = { text: `You said: "${receivedMessage.text}" 👋` }
  }

  await axios.post(
    `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      recipient: { id: senderPsid },
      message: response,
    }
  )
}
