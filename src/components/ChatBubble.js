'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

export default function ChatBubble() {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! How can I help you today?' }
  ])

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!msg.trim()) return

    // Show user's message
    setMessages(prev => [...prev, { from: 'user', text: msg }])
    const userMsg = msg
    setMsg('')

    try {
      await axios.post('/api/messenger', { text: userMsg })
      setMessages(prev => [
        ...prev,
        { from: 'bot', text: '📤 Message sent to Facebook Page!' }
      ])
    } catch (err) {
      console.error(err)
      setMessages(prev => [
        ...prev,
        { from: 'bot', text: '❌ Failed to send message.' }
      ])
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-96 h-[600px] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                💬
              </div>
              <div>
                <h2 className="font-bold text-base">Support Chat</h2>
                <p className="text-xs text-blue-100">Typically replies instantly</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 p-2 rounded-full">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-5 py-3 rounded-2xl text-sm ${
                    m.from === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-lg'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-lg'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t bg-white px-5 py-4 flex gap-3">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border border-gray-300 rounded-full px-5 py-2 text-sm bg-gray-100 text-black placeholder-gray-400"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              disabled={!msg.trim()}
              className="bg-indigo-600 text-white rounded-full px-4 py-2 disabled:bg-gray-400"
            >
              ➤
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl"
        >
          💬
        </button>
      )}
    </div>
  )
}
