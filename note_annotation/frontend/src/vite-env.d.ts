/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEDICAL_LABELING_URL?: string
  readonly VITE_SPEAKER_DIARIZATION_URL?: string
  readonly VITE_CEPHALOMETRIC_URL?: string
  readonly VITE_OP_NOTE_URL?: string
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
