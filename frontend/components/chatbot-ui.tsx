'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
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
  price: number
  image?: string
  quantity: number     // <--- Nuevo campo
}

export function ChatbotUI() {
  const [ isOpen, setIsOpen ] = useState(false)
  const [ messages, setMessages ] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente saludable 🍃. Puedo ayudarte con recetas, información nutricional o agregar productos a tu carrito. ¿En qué te ayudo?' }
  ])
  const [ input, setInput ] = useState('')
  const [ isLoading, setIsLoading ] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { addToCart } = useCart()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [ messages ])

  const dispatchCartActions = (actions: CartAction[]) => {
    if (!actions?.length) return
    actions.forEach((action) => {
      if (action.type === 'ADD_TO_CART') {
        const product: Product = {
          id: action.product_id,
          name: action.product_name,
          price: action.price,
          image: action.image || '',
          tag: '', // Opcional
        }
        addToCart(product, action.quantity) // <--- Pasamos la cantidad
      }
    })
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [ ...prev, userMsg ])
    setInput('')
    setIsLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [ ...messages, userMsg ] })
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()

      if (data.reply) {
        setMessages(prev => [ ...prev, { role: 'assistant', content: data.reply } ])
      }

      // Dispatch any cart actions the AI identified
      if (data.actions?.length) {
        dispatchCartActions(data.actions)
      }

    } catch (error) {
      console.error('Error in chat:', error)
      setMessages(prev => [ ...prev, {
        role: 'assistant',
        content: 'Lo siento, tuve un problema de conexión. 😢 Intenta de nuevo en un momento.'
      } ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="z-50">
      {/* Botón flotante (Activador) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => setIsOpen(true)}
            size="icon"
            className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 transition-all duration-300 ring-2 ring-primary/20"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Overlay de fondo (Cierre al hacer clic fuera) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel Lateral (Drawer) */}
      {isOpen && (
        <div className="fixed top-16 bottom-0 right-0 w-full max-w-[450px] bg-background/95 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-l border-border/50 animate-in slide-in-from-right duration-500 ease-out flex flex-col">

          {/* Cabecera Premium */}
          <div className="flex flex-row items-center justify-between p-6 border-b bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">Zenda Assistant</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  En línea ahora
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Área de Mensajes (Scrolleable) */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] px-5 py-3 text-[15px] leading-relaxed shadow-sm transition-all ${msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-none'
                    : 'bg-card border border-border/50 rounded-2xl rounded-bl-none text-foreground'
                  }`}>
                  <ReactMarkdown
                    components={{
                      p: ({ ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                      ul: ({ ...props }) => <ul className="list-disc ml-5 mb-3 space-y-1.5" {...props} />,
                      ol: ({ ...props }) => <ol className="list-decimal ml-5 mb-3 space-y-1.5" {...props} />,
                      strong: ({ ...props }) => <strong className="font-bold text-primary dark:text-primary-foreground" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/50 shadow-sm rounded-2xl rounded-bl-none px-5 py-4 flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-duration:800ms]" />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:200ms] [animation-duration:800ms]" />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:400ms] [animation-duration:800ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Chat Estilo Apple */}
          <div className="p-6 border-t bg-card/50 backdrop-blur-md">
            <div className="relative flex items-center gap-3">
              <input
                type="text"
                className="flex-1 h-12 px-6 rounded-2xl border border-border/60 bg-background/50 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-inner placeholder:text-muted-foreground/60"
                placeholder="Pregunta lo que quieras sobre postres..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="h-12 w-12 shrink-0 rounded-2xl shadow-lg transition-all active:scale-95"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-widest font-medium opacity-50">
              Desarrollado para Zenda Pastelería
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
