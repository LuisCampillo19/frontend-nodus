import { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, CheckCircle, Sparkles } from 'lucide-react'
import { aiApi } from '../api/endpoints/ai.js'
import { useAuthStore } from '../stores/authStore.js'
import { cn } from '../utils/cn.js'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'

const SUGGESTIONS = [
  'Gasté $50,000 en alimentación hoy',
  '¿Cuánto he gastado este mes?',
  'Ingresé $2,000,000 de mi salario',
  '¿Cuáles son mis deudas activas?',
  'Transferí $500,000 a mi cuenta de ahorros',
  '¿En qué categoría gasto más?',
]

function ActionCard({ accion }) {
  if (!accion) return null
  return (
    <div className="flex items-start gap-2 bg-success/10 border border-success/30 rounded-xl px-3 py-2.5 mt-2">
      <CheckCircle size={16} className="text-success mt-0.5 shrink-0" />
      <div className="text-xs text-success">
        <span className="font-semibold">Acción ejecutada:</span>{' '}
        {accion.tipo === 'transaccion_creada' && `Transacción registrada correctamente.`}
        {accion.tipo === 'cuota_pagada' && `Pago de cuota registrado.`}
        {!['transaccion_creada', 'cuota_pagada'].includes(accion.tipo) && accion.tipo}
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex gap-3 items-start', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold',
        isUser ? 'bg-primary' : 'bg-gradient-to-br from-primary to-info'
      )}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-primary text-white rounded-tr-none'
          : 'bg-card border border-border text-foreground rounded-tl-none'
      )}>
        {msg.content}
        {msg.accion_ejecutada && <ActionCard accion={msg.accion_ejecutada} />}
        {msg.error && (
          <p className="text-xs text-danger mt-1 bg-danger/10 rounded-lg px-2 py-1">{msg.error}</p>
        )}
      </div>
    </div>
  )
}

export default function AsistenteIAPage() {
  const user = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `¡Hola${user?.nombre ? `, ${user.nombre}` : ''}! 👋 Soy tu asistente financiero. Puedo registrar transacciones, consultar tus finanzas y ayudarte a gestionar tu dinero. ¿En qué te ayudo hoy?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const res = await aiApi.chat({ mensaje: msg })
      const d = res.data?.data ?? {}
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: d.respuesta || 'No pude procesar tu solicitud.',
          accion_ejecutada: d.accion_ejecutada ?? null,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Ocurrió un error al procesar tu mensaje.',
          error: err.response?.data?.error?.message || 'Error de conexión',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground">Asistente IA</h1>
          <p className="text-xs text-muted flex items-center gap-1"><Sparkles size={11} /> Powered by Claude</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((m, i) => <Message key={i} msg={m} />)}
        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-muted">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="py-3">
          <p className="text-xs text-muted mb-2 font-semibold">Sugerencias</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs bg-input-bg border border-border rounded-full px-3 py-1.5 text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-border">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escribe tu mensaje... (Enter para enviar)"
          rows={1}
          className="flex-1 px-4 py-3 rounded-xl border border-border bg-input-bg text-sm text-foreground outline-none focus:border-primary resize-none"
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        <Button onClick={() => send()} disabled={!input.trim() || loading} className="h-12 w-12 p-0 flex items-center justify-center shrink-0">
          <Send size={16} />
        </Button>
      </div>
    </div>
  )
}
