export const IPC = {
  // Connections
  CONNECTION_LIST: 'connection:list',
  CONNECTION_GET: 'connection:get',
  CONNECTION_CREATE: 'connection:create',
  CONNECTION_UPDATE: 'connection:update',
  CONNECTION_DELETE: 'connection:delete',

  // SSH
  SSH_CONNECT: 'ssh:connect',
  SSH_DISCONNECT: 'ssh:disconnect',
  SSH_SEND_DATA: 'ssh:send-data',
  SSH_RESIZE: 'ssh:resize',

  // SSH Events (main -> renderer)
  SSH_ON_DATA: 'ssh:on-data',
  SSH_ON_CLOSE: 'ssh:on-close',
  SSH_ON_ERROR: 'ssh:on-error',
  SSH_ON_STATUS: 'ssh:on-status',

  // SFTP
  SFTP_LIST: 'sftp:list',
  SFTP_STAT: 'sftp:stat',
  SFTP_MKDIR: 'sftp:mkdir',
  SFTP_RENAME: 'sftp:rename',
  SFTP_DELETE: 'sftp:delete',
  SFTP_DOWNLOAD: 'sftp:download',
  SFTP_UPLOAD: 'sftp:upload',
  SFTP_READ_FILE: 'sftp:read-file',

  // Local filesystem
  SHELL_READDIR: 'shell:readdir',
  SHELL_HOME_DIR: 'shell:home-dir',
  SHELL_OPEN_FILE_DIALOG: 'shell:open-file-dialog',

  // Transfers (main -> renderer)
  TRANSFER_PROGRESS: 'transfer:progress',
  TRANSFER_COMPLETE: 'transfer:complete',
  TRANSFER_ERROR: 'transfer:error',
  TRANSFER_CANCEL: 'transfer:cancel',

  // Credentials
  CREDENTIAL_STORE: 'credential:store',
  CREDENTIAL_RETRIEVE: 'credential:retrieve',
  CREDENTIAL_DELETE: 'credential:delete',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',

  // App
  APP_CHECK_UPDATE: 'app:check-update',
  APP_INSTALL_UPDATE: 'app:install-update',
  APP_GET_VERSION: 'app:get-version',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized'
} as const
