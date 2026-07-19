import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)
const emptyCart = { items: [], totalItems: 0, subtotal: 0 }

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(emptyCart)
  const [busy, setBusy] = useState(false)

  const loadCart = async () => {
    if (!user) { setCart(emptyCart); return }
    try { setCart((await api.get('/cart')).data) }
    catch { setCart(emptyCart) }
  }

  useEffect(() => { loadCart() }, [user?.id])

  const action = async (request) => {
    setBusy(true)
    try {
      const next = (await request()).data
      setCart(next)
      return next
    } finally { setBusy(false) }
  }

  const addItem = (productId, quantity = 1) => action(() => api.post('/cart/items', { productId, quantity }))
  const updateItem = (itemId, quantity) => action(() => api.put(`/cart/items/${itemId}`, { quantity }))
  const removeItem = (itemId) => action(() => api.delete(`/cart/items/${itemId}`))

  const value = useMemo(() => ({ cart, busy, loadCart, addItem, updateItem, removeItem, setCart }), [cart, busy])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
