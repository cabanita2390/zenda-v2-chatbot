'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Send, CheckCircle } from 'lucide-react'

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-6 text-lg font-medium text-foreground">
          Mensaje Enviado
        </h3>
        <p className="mt-2 text-muted-foreground">
          Gracias por contactarnos. Te responderemos pronto.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setIsSubmitted(false)}
        >
          Enviar otro mensaje
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
            <Input
              id="nombre"
              name="nombre"
              required
              placeholder="Tu nombre"
              className="border-border/50 bg-card focus:border-primary"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              className="border-border/50 bg-card focus:border-primary"
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="telefono">Telefono (opcional)</FieldLabel>
          <Input
            id="telefono"
            name="telefono"
            type="tel"
            placeholder="+34 600 000 000"
            className="border-border/50 bg-card focus:border-primary"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="asunto">Asunto</FieldLabel>
          <Input
            id="asunto"
            name="asunto"
            required
            placeholder="¿En que podemos ayudarte?"
            className="border-border/50 bg-card focus:border-primary"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="mensaje">Mensaje</FieldLabel>
          <Textarea
            id="mensaje"
            name="mensaje"
            required
            rows={5}
            placeholder="Escribe tu mensaje aqui..."
            className="border-border/50 bg-card focus:border-primary resize-none"
          />
        </Field>
      </FieldGroup>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
      >
        {isSubmitting ? (
          <>Enviando...</>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Enviar Mensaje
          </>
        )}
      </Button>
    </form>
  )
}
