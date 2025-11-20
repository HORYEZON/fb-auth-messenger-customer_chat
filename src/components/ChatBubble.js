'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

function getOrCreateSessionId() {
  let sid = localStorage.getItem('chat_session_id')
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem('chat_session_id', sid)
  }
  return sid
}

export default function ChatBubble() {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! Start a Messenger thread so replies can sync here.' }
  ])
  const [sessionId, setSessionId] = useState(null)
  const [connected, setConnected] = useState(false)
  const [isLinked, setIsLinked] = useState(false)

  const messagesEndRef = useRef(null)

  useEffect(() => {
    const sid = getOrCreateSessionId()
    setSessionId(sid)
    const es = new EventSource(`/api/stream?sessionId=${sid}`)
    es.onopen = () => setConnected(true)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setMessages(prev => [...prev, { from: 'bot', text: data.text }])
      // If we get any message from Messenger, mark as linked
      setIsLinked(true)
    }
    es.onerror = () => setConnected(false)
    return () => es.close()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => { scrollToBottom() }, [messages])

  const sendMessage = async () => {
    if (!msg.trim()) return
    setMessages(prev => [...prev, { from: 'user', text: msg }])
    const userMsg = msg
    setMsg('')
    try {
      await axios.post('/api/messenger', { text: userMsg, sessionId })
      setMessages(prev => [
        ...prev,
        { from: 'bot', text: '📤 Sent to your Facebook Page thread.' }
      ])
    } catch (err) {
      console.error(err)
      setMessages(prev => [
        ...prev,
        { from: 'bot', text: '❌ Failed to send.' }
      ])
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const pageUsername = process.env.NEXT_PUBLIC_PAGE_USERNAME
  const messengerLink = `https://m.me/${pageUsername}?ref=${sessionId}`

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-96 h-[600px] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">💬</div>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 p-2 rounded-full">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
            {!isLinked ? (
              // Show instructions and Messenger button when not linked
              <div className="h-full flex flex-col items-center justify-center space-y-6 px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-4xl shadow-lg">
                  💬
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gray-800">Connect to Messenger</h3>
                  <p className="text-sm text-gray-600 max-w-xs">
                    To receive replies here, click the button below and send a message on Messenger.
                  </p>
                </div>
                <a
                  href={messengerLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <span>Continue in Messenger</span>
                  <span className="text-lg">↗</span>
                </a>
              </div>
            ) : (
              // Show message history when linked
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-5 py-3 rounded-2xl text-sm ${
                      m.from === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-lg'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-lg'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input box - only shown when linked */}
          {isLinked && (
            <div className="border-t bg-white px-5 py-4 flex gap-3">
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 border border-gray-300 rounded-full px-5 py-2 text-sm bg-gray-100 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Type a message..."
              />
              <button
                onClick={sendMessage}
                disabled={!msg.trim()}
                className="bg-indigo-600 text-white rounded-full px-4 py-2 disabled:bg-gray-400 hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed"
              >
                ➤
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow"
        >
          💬
        </button>
      )}
    </div>
  )
}
