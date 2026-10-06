import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import apiClient from '../api/client.js'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('autobot_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => {
      setToast((current) => (current === message ? '' : current))
    }, 3000)
  }

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem('autobot_cart', JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items])

  // Sync with backend if user has logged in
  useEffect(() => {
    const token = localStorage.getItem('autobot_token')
    if (token) {
      apiClient.get('/cart').then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          const remoteItems = data.map((item) => ({
            id: item.product_id,
            name: item.name,
            price: Number(item.price),
            oldPrice: item.old_price ? Number(item.old_price) : null,
            image: item.image_url,
            grade: item.grade,
            quantity: item.quantity,
            stock_quantity: item.stock_quantity
          }))
          setItems(remoteItems)
        }
      }).catch(() => {})
    }
  }, [])

  const addItem = async (product, quantity = 1) => {
    const qtyToAdd = Math.max(1, Number(quantity) || 1)
    setItems((current) => {
      const found = current.find((item) => item.id === product.id)
      if (found) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + qtyToAdd } : item
        )
      }
      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          oldPrice: product.old_price || product.oldPrice || null,
          image: product.image_url || product.image,
          grade: product.grade || product.category_name,
          quantity: qtyToAdd,
          stock_quantity: product.stock_quantity
        }
      ]
    })
    showToast(`Đã thêm "${product.name}" vào giỏ hàng!`)

    // Background sync to backend if logged in
    const token = localStorage.getItem('autobot_token')
    if (token) {
      apiClient.post('/cart', { productId: product.id, quantity: qtyToAdd }).catch(() => {})
    }
  }

  const updateQuantity = async (id, quantity) => {
    const qty = Number(quantity)
    if (qty <= 0) {
      removeItem(id)
      return
    }
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    )

    const token = localStorage.getItem('autobot_token')
    if (token) {
      apiClient.put(`/cart/${id}`, { quantity: qty }).catch(() => {})
    }
  }

  const removeItem = async (id) => {
    setItems((current) => current.filter((item) => item.id !== id))
    const token = localStorage.getItem('autobot_token')
    if (token) {
      apiClient.delete(`/cart/${id}`).catch(() => {})
    }
  }

  const clear = async () => {
    setItems([])
    localStorage.removeItem('autobot_cart')
    const token = localStorage.getItem('autobot_token')
    if (token) {
      apiClient.delete('/cart').catch(() => {})
    }
  }

  const totalCount = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items])
  const totalAmount = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clear,
        totalCount,
        totalAmount,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        toast,
        showToast
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}