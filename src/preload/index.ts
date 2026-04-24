import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/constants'
import type {
  SshDataEvent,
  SshCloseEvent,
  SshErrorEvent,
  SshStatusEvent,
  SshConnectParams,
  SshSendDataParams,
  SshResizeParams
} from '@shared/types/terminal'
import type {
  TransferProgressEvent,
  TransferCompleteEvent,
  TransferErrorEvent
} from '@shared/types/transfer'
import type { CreateConnectionInput, UpdateConnectionInput } from '@shared/types/connection'
import type {
  SftpListParams,
  SftpMkdirParams,
  SftpRenameParams,
  SftpDeleteParams,
  SftpReadFileParams,
  SftpTransferParams
} from '@shared/types/sftp'

type CleanupFn = () => void

function createEventListener<T>(channel: string) {
  return (callback: (payload: T) => void): CleanupFn => {
    const listener = (_event: Electron.IpcRendererEvent, payload: T): void => {
      callback(payload)
    }
    ipcRenderer.on(channel, listener)
    return () => {
      ipcRenderer.removeListener(channel, listener)
    }
  }
}

const api = {
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPC.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.invoke(IPC.WINDOW_CLOSE),
    isMaximized: () => ipcRenderer.invoke(IPC.WINDOW_IS_MAXIMIZED) as Promise<boolean>
  },

  // Connection CRUD
  connections: {
    list: () => ipcRenderer.invoke(IPC.CONNECTION_LIST),
    get: (id: string) => ipcRenderer.invoke(IPC.CONNECTION_GET, id),
    create: (input: CreateConnectionInput) => ipcRenderer.invoke(IPC.CONNECTION_CREATE, input),
    update: (input: UpdateConnectionInput) => ipcRenderer.invoke(IPC.CONNECTION_UPDATE, input),
    delete: (id: string) => ipcRenderer.invoke(IPC.CONNECTION_DELETE, id)
  },

  // SSH sessions
  ssh: {
    connect: (params: SshConnectParams) => ipcRenderer.invoke(IPC.SSH_CONNECT, params),
    disconnect: (sessionId: string) => ipcRenderer.invoke(IPC.SSH_DISCONNECT, sessionId),
    sendData: (params: SshSendDataParams) => ipcRenderer.invoke(IPC.SSH_SEND_DATA, params),
    resize: (params: SshResizeParams) => ipcRenderer.invoke(IPC.SSH_RESIZE, params),
    onData: createEventListener<SshDataEvent>(IPC.SSH_ON_DATA),
    onClose: createEventListener<SshCloseEvent>(IPC.SSH_ON_CLOSE),
    onError: createEventListener<SshErrorEvent>(IPC.SSH_ON_ERROR),
    onStatus: createEventListener<SshStatusEvent>(IPC.SSH_ON_STATUS)
  },

  // SFTP operations
  sftp: {
    list: (params: SftpListParams) => ipcRenderer.invoke(IPC.SFTP_LIST, params),
    mkdir: (params: SftpMkdirParams) => ipcRenderer.invoke(IPC.SFTP_MKDIR, params),
    rename: (params: SftpRenameParams) => ipcRenderer.invoke(IPC.SFTP_RENAME, params),
    delete: (params: SftpDeleteParams) => ipcRenderer.invoke(IPC.SFTP_DELETE, params),
    readFile: (params: SftpReadFileParams) => ipcRenderer.invoke(IPC.SFTP_READ_FILE, params),
    download: (params: SftpTransferParams) => ipcRenderer.invoke(IPC.SFTP_DOWNLOAD, params),
    upload: (params: SftpTransferParams) => ipcRenderer.invoke(IPC.SFTP_UPLOAD, params)
  },

  // Local filesystem
  shell: {
    readdir: (path: string) => ipcRenderer.invoke(IPC.SHELL_READDIR, path),
    homeDir: () => ipcRenderer.invoke(IPC.SHELL_HOME_DIR),
    openFileDialog: (options?: unknown) => ipcRenderer.invoke(IPC.SHELL_OPEN_FILE_DIALOG, options),
    joinPath: (base: string, fileName: string) =>
      ipcRenderer.invoke(IPC.SHELL_JOIN_PATH, { base, fileName }) as Promise<string>
  },

  // Transfer events
  transfers: {
    cancel: (transferId: string) => ipcRenderer.invoke(IPC.TRANSFER_CANCEL, transferId),
    onProgress: createEventListener<TransferProgressEvent>(IPC.TRANSFER_PROGRESS),
    onComplete: createEventListener<TransferCompleteEvent>(IPC.TRANSFER_COMPLETE),
    onError: createEventListener<TransferErrorEvent>(IPC.TRANSFER_ERROR)
  },

  // Credentials
  credentials: {
    store: (connectionId: string, secret: string) =>
      ipcRenderer.invoke(IPC.CREDENTIAL_STORE, { connectionId, secret }),
    retrieve: (connectionId: string) => ipcRenderer.invoke(IPC.CREDENTIAL_RETRIEVE, connectionId),
    delete: (connectionId: string) => ipcRenderer.invoke(IPC.CREDENTIAL_DELETE, connectionId)
  },

  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke(IPC.SETTINGS_GET, key),
    set: (key: string, value: string) => ipcRenderer.invoke(IPC.SETTINGS_SET, { key, value }),
    getAll: () => ipcRenderer.invoke(IPC.SETTINGS_GET_ALL)
  },

  // App info
  app: {
    getVersion: () => ipcRenderer.invoke(IPC.APP_GET_VERSION) as Promise<string>,
    checkUpdate: () => ipcRenderer.invoke(IPC.APP_CHECK_UPDATE),
    installUpdate: () => ipcRenderer.invoke(IPC.APP_INSTALL_UPDATE)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type LunarAPI = typeof api
