import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: number
  tone: ToastTone
  message: string
  action?: ToastAction
}

interface ToastState {
  toasts: ToastItem[]
  push: (toast: Omit<ToastItem, 'id'>, duration: number) => void
  dismiss: (id: number) => void
}

const MAX_VISIBLE = 4
let nextId = 1

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast, duration) => {
    const id = nextId++
    set({ toasts: [...get().toasts.slice(-(MAX_VISIBLE - 1)), { ...toast, id }] })
    window.setTimeout(() => get().dismiss(id), duration)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}))

const push = (tone: ToastTone, message: string, action?: ToastAction, duration = 4000) =>
  useToastStore.getState().push({ tone, message, action }, action ? 6000 : duration)

export const toast = {
  success: (message: string, action?: ToastAction) => push('success', message, action),
  error: (message: string) => push('error', message, undefined, 6000),
  info: (message: string, action?: ToastAction) => push('info', message, action),
}
