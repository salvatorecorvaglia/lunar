import { create } from 'zustand'

interface ConnectionState {
  activeConnectionId: string | null
  quickConnectValue: string
  connectionFormOpen: boolean
  editingConnectionId: string | null

  setActiveConnectionId: (id: string | null) => void
  setQuickConnectValue: (value: string) => void
  setConnectionFormOpen: (open: boolean) => void
  setEditingConnectionId: (id: string | null) => void
  openEditForm: (id: string) => void
  openCreateForm: () => void
  closeForm: () => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  activeConnectionId: null,
  quickConnectValue: '',
  connectionFormOpen: false,
  editingConnectionId: null,

  setActiveConnectionId: (id) => set({ activeConnectionId: id }),
  setQuickConnectValue: (value) => set({ quickConnectValue: value }),
  setConnectionFormOpen: (open) => set({ connectionFormOpen: open }),
  setEditingConnectionId: (id) => set({ editingConnectionId: id }),
  openEditForm: (id) => set({ connectionFormOpen: true, editingConnectionId: id }),
  openCreateForm: () => set({ connectionFormOpen: true, editingConnectionId: null }),
  closeForm: () => set({ connectionFormOpen: false, editingConnectionId: null })
}))
