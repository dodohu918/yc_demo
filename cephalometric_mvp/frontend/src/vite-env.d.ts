/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_MEDICAL_LABELING_URL: string
  readonly VITE_SPEAKER_DIARIZATION_URL: string
  readonly VITE_CEPHALOMETRIC_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
