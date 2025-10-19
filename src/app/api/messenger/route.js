import axios from 'axios'

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN
const TEST_PSID = process.env.TEST_PSID

// ✅ 1. Verification (for webhook setup)
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WEBHOOK VERIFIED')
    return new Response(challenge, { status: 200 })
  }

  console.error('❌ Verification failed')
  return new Response('Forbidden', { status: 403 })
}

// ✅ 2. Handle Facebook webhook events (when someone messages your Page)
export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || ''
    const body = await req.json()

    // 🧠 1️⃣ If webhook (Facebook → us)
    if (body.object === 'page') {
      for (const entry of body.entry) {
        const webhookEvent = entry.messaging[0]
        console.log('📩 Message received:', webhookEvent)

        const senderPsid = webhookEvent.sender.id
        if (webhookEvent.message) {
          await handleMessage(senderPsid, webhookEvent.message)
        }
      }
      return new Response('EVENT_RECEIVED', { status: 200 })
    }

    // 🧠 2️⃣ Otherwise, frontend → send message to Messenger
    if (body.text) {
      const text = body.text
      const testUserPsid = process.env.TEST_PSID

      if (!testUserPsid) {
        console.error('❌ Missing TEST_PSID')
        return new Response('Missing TEST_PSID in .env.local', { status: 400 })
      }

      console.log(`⚡ Sending to Facebook: "${text}" → PSID: ${testUserPsid}`)

      try {
        const fbResponse = await axios.post(
          `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
          {
            recipient: { id: testUserPsid },
            message: { text },
          }
        )

        console.log('✅ Sent successfully:', fbResponse.data)
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      } catch (fbErr) {
        console.error('❌ Facebook API error:', fbErr.response?.data || fbErr.message)
        return new Response('Failed to send message.', { status: 500 })
      }
    }

    return new Response('Unsupported request', { status: 400 })
  } catch (err) {
    console.error('❌ Messenger webhook error:', err.response?.data || err.message)
    return new Response('Internal Server Error', { status: 500 })
  }
}


// ✅ Helper function (auto reply to incoming messages)
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
