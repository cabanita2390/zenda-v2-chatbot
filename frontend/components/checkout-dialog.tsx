'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/utils'
import { Loader2, Copy, CheckCircle2 } from 'lucide-react'

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const { items, subtotal, clearCart } = useCart()
  const [ loading, setLoading ] = useState(false)
  const [ successOrder, setSuccessOrder ] = useState<any>(null)
  const [ copied, setCopied ] = useState(false)
  const [ errorMsg, setErrorMsg ] = useState('')

  const copyNequi = () => {
    navigator.clipboard.writeText('3001234567') // Nequi simulado
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const formData = new FormData(e.currentTarget)
    const payload = {
      shipping_address: formData.get('address') as string,
      customer: {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
      },
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    }

    try {
      // Ajusta la URL a la variable de entorno real en producción
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Error al crear el pedido.')

      const data = await res.json()
      setSuccessOrder(data)
      clearCart()
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (newOpen: boolean) => {
    if (!newOpen && successOrder) {
      // Resetear al cerrar si fue exitoso
      setTimeout(() => setSuccessOrder(null), 300)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        {!successOrder ? (
          <>
            <DialogHeader>
              <DialogTitle>Completar Pedido</DialogTitle>
              <DialogDescription>
                Ingresa tus datos para generar tu orden. El pago se realiza por transferencia.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" name="name" required placeholder="Ej: Maria Lopez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" name="email" type="email" required placeholder="ejemplo@zenda.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Celular (Nequi/Daviplata)</Label>
                <Input id="phone" name="phone" required placeholder="300..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección de envío</Label>
                <Input id="address" name="address" required placeholder="Calle 123 #45-67" />
              </div>

              {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

              <div className="mt-4 flex items-center justify-between border-t pt-4 font-medium">
                <span>Total a pagar:</span>
                <span className="text-lg">{formatPrice(subtotal)}</span>
              </div>

              <Button type="submit" className="w-full mt-4" disabled={loading || items.length === 0}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generar Pedido'}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">¡Pedido Generado!</DialogTitle>
            <DialogDescription className="text-base">
              Tu número de pedido es:<br />
              <strong className="text-foreground tracking-wider select-all">{successOrder.id}</strong>
            </DialogDescription>

            <div className="w-full rounded-lg bg-accent/50 p-4 mt-4 text-left">
              <h4 className="font-medium mb-2">Instrucciones de Pago</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Para confirmar tu pedido, por favor transfiere <strong>{formatPrice(successOrder.total_amount)}</strong> a nuestra cuenta Nequi:
              </p>
              <div className="flex items-center gap-2">
                <span className="flex-1 rounded bg-background px-3 py-2 text-lg text-center font-bold selection:text-primary-foreground">
                  319 581 1958
                </span>
                <Button size="icon" variant="outline" onClick={copyNequi} title="Copiar número">
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Una vez transferido, cuéntale a nuestro asistente virtual o comunícate con nosotros para procesar el envío.
            </p>
            <Button className="w-full mt-4" onClick={() => handleClose(false)}>
              Entendido
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
