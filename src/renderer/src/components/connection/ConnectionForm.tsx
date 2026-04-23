import { useState, useEffect } from 'react'
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
  Folder,
  Palette,
  Terminal as TerminalIcon,
  Eye,
  EyeOff
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
    label: 'Key + Passphrase',
    icon: <FileKey className="h-4 w-4" />
  }
]

const COLOR_OPTIONS = [
  '#22c55e', '#3b82f6', '#a855f7', '#f43f5e',
  '#f97316', '#eab308', '#06b6d4', '#ec4899'
]

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

  const isEditing = !!editingConnectionId

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
  }, [editingConnection, connectionFormOpen])

  function resetForm() {
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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
    } catch (err: any) {
      toast.error(err.message || 'Failed to save connection')
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeForm}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">
                    {isEditing ? 'Edit Connection' : 'New Connection'}
                  </h2>
                </div>
                <button
                  onClick={closeForm}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Name */}
                <FormField label="Connection Name" icon={<Server className="h-3.5 w-3.5" />}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Server"
                    className="form-input"
                    autoFocus
                  />
                </FormField>

                {/* Host + Port */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <FormField label="Host" icon={<Globe className="h-3.5 w-3.5" />}>
                      <input
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="192.168.1.100 or example.com"
                        className="form-input"
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
                <FormField label="Username" icon={<User className="h-3.5 w-3.5" />}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="root"
                    className="form-input"
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
                          'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                          authType === type.value
                            ? 'border-ring bg-accent text-foreground'
                            : 'border-border text-muted-foreground hover:border-ring/50'
                        )}
                      >
                        {type.icon}
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password / Key fields */}
                {authType === 'password' && (
                  <FormField label="Password" icon={<Lock className="h-3.5 w-3.5" />}>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isEditing ? '(unchanged)' : 'Enter password'}
                        className="form-input pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </FormField>
                )}

                {(authType === 'key' || authType === 'key+passphrase') && (
                  <FormField label="Private Key Path" icon={<FileKey className="h-3.5 w-3.5" />}>
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
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        Browse
                      </button>
                    </div>
                  </FormField>
                )}

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

                {/* Color Tag */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Palette className="h-3.5 w-3.5" />
                    Color Tag
                  </label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setColorTag(color)}
                        className={cn(
                          'h-6 w-6 rounded-full transition-all',
                          colorTag === color
                            ? 'ring-2 ring-ring ring-offset-2 ring-offset-card scale-110'
                            : 'hover:scale-110'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Startup Command */}
                <FormField
                  label="Startup Command (optional)"
                  icon={<TerminalIcon className="h-3.5 w-3.5" />}
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
                    className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving...'
                      : isEditing
                        ? 'Update'
                        : 'Create'}
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
  children
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}
