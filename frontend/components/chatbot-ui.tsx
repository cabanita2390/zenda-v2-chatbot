'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Product, useCart } from '@/lib/cart-context'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface CartAction {
  type: 'ADD_TO_CART'
  product_id: number
  product_name: string
}

export function ChatbotUI() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente saludable 🍃. Puedo ayudarte con recetas, información nutricional o agregar productos a tu carrito. ¿En qué te ayudo?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { addToCart } = useCart()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const dispatchCartActions = (actions: CartAction[]) => {
    if (!actions?.length) return
    actions.forEach((action) => {
      if (action.type === 'ADD_TO_CART') {
        // Build a minimal Product to match CartContext interface
        const product: Product = {
          id: action.product_id,
          name: action.product_name,
          price: 0,   // Price will be filled from DB on next full load
          tag: '',
          image: '',
        }
        addToCart(product)
      }
    })
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }

      // Dispatch any cart actions the AI identified
      if (data.actions?.length) {
        dispatchCartActions(data.actions)
      }

    } catch (error) {
      console.error('Error in chat:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, tuve un problema de conexión. 😢 Intenta de nuevo en un momento.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating trigger button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <Card className="w-[360px] h-[550px] flex flex-col shadow-2xl border-border/60 animate-in slide-in-from-bottom-5 fade-in-0 zoom-in-95 duration-200">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-card rounded-t-xl">
            <CardTitle className="text-base flex items-center gap-2 font-medium tracking-tight">
              <Bot className="h-5 w-5 text-primary" />
              Zenda Assistant
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-y-auto bg-accent/10 flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                    : 'bg-background border rounded-2xl rounded-bl-sm text-foreground'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-background border shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="p-4 border-t bg-card rounded-b-xl flex items-center gap-2">
            <input
              type="text"
              className="flex-1 h-10 px-4 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 shrink-0 rounded-full transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
