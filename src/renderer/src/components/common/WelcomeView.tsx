import { Terminal, FolderOpen, Plus, Zap, Command } from 'lucide-react'
import { motion } from 'framer-motion'
import { useConnectionStore } from '@/stores/connection-store'

export function WelcomeView() {
  const { openCreateForm } = useConnectionStore()

  return (
    <div className="flex h-full items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20"
        >
          <Terminal className="h-8 w-8 text-white" />
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground">Welcome to Lunar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A modern SSH terminal and SFTP file manager
        </p>

        {/* Quick Actions */}
        <div className="mt-8 grid gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openCreateForm()}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-ring hover:bg-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Plus className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">New Connection</div>
              <div className="text-xs text-muted-foreground">
                Set up an SSH connection to a server
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-ring hover:bg-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Zap className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Quick Connect</div>
              <div className="text-xs text-muted-foreground">
                Connect with user@host:port format
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-ring hover:bg-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <FolderOpen className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">SFTP Browser</div>
              <div className="text-xs text-muted-foreground">
                Browse and transfer files over SSH
              </div>
            </div>
          </motion.button>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Command className="h-3 w-3" />
          <span>+</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            K
          </kbd>
          <span className="ml-1">to open command palette</span>
        </div>
      </motion.div>
    </div>
  )
}
