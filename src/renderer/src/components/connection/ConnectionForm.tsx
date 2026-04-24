import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Server,
  Key,
  Lock,
  User,
  Globe,
  Hash,
  FileKey,
  Palette,
  Terminal as TerminalIcon,
  Eye,
  EyeOff,
  Loader2,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connection-store'
import { useCreateConnection, useUpdateConnection, useConnection } from '@/hooks/use-connections'
import type { AuthType } from '@shared/types/connection'
import { toast } from 'sonner'

const AUTH_TYPES: { value: AuthType; label: string; icon: React.ReactNode }[] = [
  { value: 'password', label: 'Password', icon: <Lock className="h-4 w-4" /> },
  { value: 'key', label: 'SSH Key', icon: <Key className="h-4 w-4" /> },
  {
    value: 'key+passphrase',
    label: 'Key + Pass',
    icon: <FileKey className="h-4 w-4" />
  }
]

const COLOR_OPTIONS = [
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#06b6d4',
  '#ec4899'
]

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

const dialogVariants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: { opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.15 } }
}

export function ConnectionForm() {
  const { connectionFormOpen, editingConnectionId, closeForm } = useConnectionStore()
  const { data: editingConnection } = useConnection(editingConnectionId)
  const createMutation = useCreateConnection()
  const updateMutation = useUpdateConnection()

  const [name, setName] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('22')
  const [username, setUsername] = useState('')
  const [authType, setAuthType] = useState<AuthType>('password')
  const [password, setPassword] = useState('')
  const [privateKeyPath, setPrivateKeyPath] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [folder, setFolder] = useState('default')
  const [colorTag, setColorTag] = useState<string>('#22c55e')
  const [startupCommand, setStartupCommand] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const isEditing = !!editingConnectionId
  const isSaving = createMutation.isPending || updateMutation.isPending

  // Close on Escape
  useEffect(() => {
    if (!connectionFormOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeForm()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [connectionFormOpen, closeForm])

  const resetForm = useCallback(() => {
    setName('')
    setHost('')
    setPort('22')
    setUsername('')
    setAuthType('password')
    setPassword('')
    setPrivateKeyPath('')
    setPassphrase('')
    setFolder('default')
    setColorTag('#22c55e')
    setStartupCommand('')
    setShowPassword(false)
    setTouched({})
  }, [])

  useEffect(() => {
    if (editingConnection) {
      setName(editingConnection.name)
      setHost(editingConnection.host)
      setPort(String(editingConnection.port))
      setUsername(editingConnection.username)
      setAuthType(editingConnection.authType)
      setPrivateKeyPath(editingConnection.privateKeyPath || '')
      setFolder(editingConnection.folder)
      setColorTag(editingConnection.colorTag || '#22c55e')
      setStartupCommand(editingConnection.startupCommand || '')
      setPassword('')
      setPassphrase('')
    } else {
      resetForm()
    }
    setTouched({})
  }, [editingConnection, connectionFormOpen, resetForm])

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }, [])

  const fieldError = (field: string, value: string) => {
    if (!touched[field]) return false
    return !value.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ name: true, host: true, username: true })

    if (!name.trim() || !host.trim() || !username.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    const data = {
      name: name.trim(),
      host: host.trim(),
      port: parseInt(port) || 22,
      username: username.trim(),
      authType,
      privateKeyPath: privateKeyPath || undefined,
      password: password || undefined,
      passphrase: passphrase || undefined,
      folder: folder.trim() || 'default',
      colorTag,
      startupCommand: startupCommand.trim() || undefined
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: editingConnectionId!, ...data })
        toast.success('Connection updated')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Connection created')
      }
      closeForm()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save connection')
    }
  }

  async function handleBrowseKey() {
    const path = await window.api.shell.openFileDialog({
      filters: [{ name: 'SSH Keys', extensions: ['pem', 'key', 'pub', ''] }]
    })
    if (path) {
      setPrivateKeyPath(path)
    }
  }

  return (
    <AnimatePresence>
      {connectionFormOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeForm}
          />

          {/* Dialog */}
          <motion.div
            variants={dialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-lg rounded-xl border border-border/80 bg-card shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Server className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">
                    {isEditing ? 'Edit Connection' : 'New Connection'}
                  </h2>
                </div>
                <button onClick={closeForm} className="btn-icon" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Name */}
                <FormField
                  label="Connection Name"
                  icon={<Server className="h-3.5 w-3.5" />}
                  required
                >
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => markTouched('name')}
                    placeholder="My Server"
                    className={cn(
                      'form-input',
                      fieldError('name', name) && 'border-destructive/60 focus:border-destructive'
                    )}
                    autoFocus
                  />
                </FormField>

                {/* Host + Port */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <FormField label="Host" icon={<Globe className="h-3.5 w-3.5" />} required>
                      <input
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        onBlur={() => markTouched('host')}
                        placeholder="192.168.1.100"
                        className={cn(
                          'form-input',
                          fieldError('host', host) &&
                            'border-destructive/60 focus:border-destructive'
                        )}
                      />
                    </FormField>
                  </div>
                  <FormField label="Port" icon={<Hash className="h-3.5 w-3.5" />}>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder="22"
                      className="form-input"
                    />
                  </FormField>
                </div>

                {/* Username */}
                <FormField label="Username" icon={<User className="h-3.5 w-3.5" />} required>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => markTouched('username')}
                    placeholder="root"
                    className={cn(
                      'form-input',
                      fieldError('username', username) &&
                        'border-destructive/60 focus:border-destructive'
                    )}
                  />
                </FormField>

                {/* Auth Type */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Key className="h-3.5 w-3.5" />
                    Authentication
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {AUTH_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setAuthType(type.value)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer',
                          authType === type.value
                            ? 'border-ring bg-accent text-foreground shadow-xs'
                            : 'border-border text-muted-foreground hover:border-border hover:bg-accent/50'
                        )}
                      >
                        {type.icon}
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password / Key fields */}
                <AnimatePresence mode="wait">
                  {authType === 'password' && (
                    <motion.div
                      key="password"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <FormField label="Password" icon={<Lock className="h-3.5 w-3.5" />}>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isEditing ? '(unchanged)' : 'Enter password'}
                            className="form-input pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/60 hover:text-foreground cursor-pointer"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </FormField>
                    </motion.div>
                  )}

                  {(authType === 'key' || authType === 'key+passphrase') && (
                    <motion.div
                      key="key"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <FormField
                        label="Private Key Path"
                        icon={<FileKey className="h-3.5 w-3.5" />}
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={privateKeyPath}
                            onChange={(e) => setPrivateKeyPath(e.target.value)}
                            placeholder="~/.ssh/id_rsa"
                            className="form-input flex-1"
                          />
                          <button
                            type="button"
                            onClick={handleBrowseKey}
                            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                          >
                            Browse
                          </button>
                        </div>
                      </FormField>

                      {authType === 'key+passphrase' && (
                        <FormField label="Passphrase" icon={<Lock className="h-3.5 w-3.5" />}>
                          <input
                            type="password"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            placeholder={isEditing ? '(unchanged)' : 'Key passphrase'}
                            className="form-input"
                          />
                        </FormField>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Color Tag */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Palette className="h-3.5 w-3.5" />
                    Color Tag
                  </label>
                  <div className="flex gap-2.5">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setColorTag(color)}
                        className={cn(
                          'relative h-7 w-7 rounded-full cursor-pointer',
                          colorTag === color
                            ? 'ring-2 ring-ring ring-offset-2 ring-offset-card'
                            : 'hover:scale-110'
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {colorTag === color && (
                          <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-sm" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Startup Command */}
                <FormField
                  label="Startup Command"
                  icon={<TerminalIcon className="h-3.5 w-3.5" />}
                  optional
                >
                  <input
                    type="text"
                    value={startupCommand}
                    onChange={(e) => setStartupCommand(e.target.value)}
                    placeholder="cd /var/www && ls -la"
                    className="form-input"
                  />
                </FormField>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function FormField({
  label,
  icon,
  children,
  required,
  optional
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
  required?: boolean
  optional?: boolean
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
        {required && <span className="text-destructive/70">*</span>}
        {optional && <span className="text-muted-foreground/50">(optional)</span>}
      </label>
      {children}
    </div>
  )
}
