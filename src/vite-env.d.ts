/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_PWA: string
  readonly VITE_BRAND_NAME: string
  readonly VITE_BRAND_TAGLINE: string
  readonly VITE_PRIMARY_COLOR: string
  readonly VITE_PRIMARY_HOVER: string
  readonly VITE_LOGO_URL: string
  readonly VITE_FAVICON_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
