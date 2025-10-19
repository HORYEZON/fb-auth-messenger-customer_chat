'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession, signIn, signOut } from "next-auth/react";
import axios from 'axios'

export default function ChatBubble() {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! How can I help you today?' }
  ])
  const messagesEndRef = useRef(null)
  const { data: session } = useSession();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!msg.trim()) return

    // instantly show user's message
    setMessages([...messages, { from: 'user', text: msg }])
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

  const isLoggedIn = !!session

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-96 h-[600px] bg-gradient-to-b from-white via-white to-gray-50 rounded-3xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/30">
                💬
              </div>
              <div>
                <h2 className="font-bold text-base tracking-wide">Support Chat</h2>
                <p className="text-xs text-blue-100 font-medium">Typically replies instantly</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition-all duration-200 hover:scale-110"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center px-4">
                No messages yet. Start a conversation!
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-3 duration-300`}
              >
                <div
                  className={`max-w-xs px-5 py-3 rounded-2xl text-sm leading-relaxed font-medium ${
                    m.from === 'user'
                      ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-br-lg shadow-lg'
                      : 'bg-white text-gray-800 border-2 border-gray-200 rounded-bl-lg shadow-md hover:shadow-lg transition-shadow'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input / Login */}
          <div className="border-t-2 border-gray-200/50 bg-white px-5 py-4 flex gap-3 flex-shrink-0">
            {!isLoggedIn ? (
              <button
                onClick={() => signIn('facebook')}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-full py-2.5 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Continue with Facebook
              </button>
            ) : (
              <>
                <input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 border-2 border-gray-300 rounded-full px-5 py-2.5 text-sm text-black focus:outline-none focus:ring-0 focus:border-indigo-500 transition-colors bg-gray-50 placeholder-gray-600 font-medium"
                  placeholder="Type a message..."
                  maxLength="500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!msg.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-full p-2.5 transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  ➤
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="group relative bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-700 hover:via-blue-700 hover:to-cyan-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-125 active:scale-95"
        >
          <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">💬</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </button>
      )}
    </div>
  )
}
