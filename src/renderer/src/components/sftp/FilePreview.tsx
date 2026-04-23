import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, FileImage, FileCode } from 'lucide-react'
import { useSftpStore } from '@/stores/sftp-store'

function detectLanguage(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    html: 'html',
    css: 'css',
    sh: 'bash',
    bash: 'bash',
    md: 'markdown',
    sql: 'sql',
    toml: 'toml'
  }
  return map[ext || ''] || 'text'
}

function isImageType(type: string): boolean {
  return ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'].includes(type)
}

export function FilePreview() {
  const { previewFile, setPreviewFile } = useSftpStore()

  return (
    <AnimatePresence>
      {previewFile && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewFile(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-8 z-50 flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                {isImageType(previewFile.type) ? (
                  <FileImage className="h-4 w-4 text-pink-400" />
                ) : (
                  <FileCode className="h-4 w-4 text-green-400" />
                )}
                <span className="text-sm font-medium text-foreground">{previewFile.name}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {detectLanguage(previewFile.name)}
                </span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {isImageType(previewFile.type) ? (
                <div className="flex h-full items-center justify-center">
                  <img
                    src={`data:${previewFile.type};base64,${previewFile.content}`}
                    alt={previewFile.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground">
                  {previewFile.content}
                </pre>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
