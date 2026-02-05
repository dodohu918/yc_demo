import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface Landmark {
  id: number
  abbreviation: string
  name: string
  description: string | null
  display_order: number
}

export interface Image {
  id: string
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  width: number
  height: number
  mime_type: string
  uploaded_at: string
}

export interface Annotation {
  id: string
  image_id: string
  landmark_id: number
  x: number
  y: number
  confidence: number | null
  source: 'manual' | 'ai_predicted' | 'ai_corrected'
  is_visible: boolean
  created_at: string
  updated_at: string
  landmark?: Landmark
}

export interface PredictionPoint {
  landmark_id: number
  abbreviation: string
  name: string
  x: number
  y: number
  confidence: number
}

export interface PredictionResponse {
  image_id: string
  predictions: PredictionPoint[]
  model_version: string
}

// API functions
export const getLandmarks = () => api.get<Landmark[]>('/landmarks')

export const getImages = (skip = 0, limit = 50) =>
  api.get<Image[]>('/images', { params: { skip, limit } })

export const getImage = (id: string) => api.get<Image>(`/images/${id}`)

export const uploadImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post<{ image: Image; message: string }>('/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const deleteImage = (id: string) => api.delete(`/images/${id}`)

export const getImageAnnotations = (imageId: string) =>
  api.get<Annotation[]>(`/images/${imageId}/annotations`)

export const createAnnotation = (data: {
  image_id: string
  landmark_id: number
  x: number
  y: number
  source?: 'manual' | 'ai_predicted' | 'ai_corrected'
}) => api.post<Annotation>('/annotations', data)

export const updateAnnotation = (
  id: string,
  data: { x?: number; y?: number; is_visible?: boolean }
) => api.patch<Annotation>(`/annotations/${id}`, data)

export const deleteAnnotation = (id: string) => api.delete(`/annotations/${id}`)

export const createFeedback = (
  annotationId: string,
  data: {
    action: 'accepted' | 'adjusted' | 'rejected'
    corrected_x?: number
    corrected_y?: number
  }
) => api.post(`/annotations/${annotationId}/feedback`, data)

export const predictLandmarks = (imageId: string) =>
  api.post<PredictionResponse>('/predictions', { image_id: imageId })

export const getPredictionStatus = () =>
  api.get<{ model_loaded: boolean; model_version: string | null; device: string }>(
    '/predictions/status'
  )

// Dataset Export types and functions
export interface DatasetStats {
  total_images: number
  fully_annotated: number
  partially_annotated: number
  not_annotated: number
  ready_for_export: number
  annotation_distribution: Record<number, number>
}

export interface ExportRequest {
  image_ids?: string[]
  format: 'csv' | 'json' | 'coco'
  split: boolean
  train_ratio: number
  val_ratio: number
  test_ratio: number
  min_annotations: number
  seed: number
  include_images: boolean
}

export interface ExportPreview {
  metadata: {
    success: boolean
    format: string
    num_images: number
    num_landmarks: number
    exported_at: string
    split: { train: number; val: number; test: number } | null
  }
  sample_data: string | null
}

export const getDatasetStats = () => api.get<DatasetStats>('/datasets/stats')

export const previewExport = (request: ExportRequest) =>
  api.post<ExportPreview>('/datasets/export/preview', request)

export const exportDataset = async (request: ExportRequest): Promise<Blob> => {
  const response = await api.post('/datasets/export', request, {
    responseType: 'blob',
  })
  return response.data
}
