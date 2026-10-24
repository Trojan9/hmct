/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the task API. Empty means same origin (proxied). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
