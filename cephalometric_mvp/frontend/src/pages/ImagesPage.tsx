import { useCallback, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Upload, Trash2, Eye } from 'lucide-react'
import { getImages, uploadImage, deleteImage, type Image } from '@/utils/api'

export default function ImagesPage() {
  const [isDragging, setIsDragging] = useState(false)
  const queryClient = useQueryClient()

  const { data: images, isLoading } = useQuery({
    queryKey: ['images'],
    queryFn: () => getImages().then((r) => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
    },
  })

  const handleFiles = useCallback(
    (files: FileList) => {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          uploadMutation.mutate(file)
        }
      })
    },
    [uploadMutation]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Images</h1>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-8 mb-8 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-300 hover:border-primary-400'
        }`}
      >
        <Upload className="mx-auto mb-4 text-slate-400" size={48} />
        <p className="text-lg mb-2">Drag and drop images here</p>
        <p className="text-sm text-slate-500 mb-4">or</p>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <span className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Browse Files
          </span>
        </label>
        {uploadMutation.isPending && (
          <p className="mt-4 text-sm text-slate-500">Uploading...</p>
        )}
      </div>

      {/* Image Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading images...</p>
        </div>
      ) : images && images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onDelete={() => deleteMutation.mutate(image.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-slate-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  )
}

function ImageCard({ image, onDelete }: { image: Image; onDelete: () => void }) {
  return (
    <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm border border-slate-200">
      <div className="aspect-square bg-slate-100">
        <img
          src={`/uploads/${image.filename}`}
          alt={image.original_filename}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Link
          to={`/annotate/${image.id}`}
          className="p-2 bg-white rounded-lg hover:bg-slate-100 transition-colors"
          title="Annotate"
        >
          <Eye size={20} />
        </Link>
        <button
          onClick={onDelete}
          className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-sm truncate" title={image.original_filename}>
          {image.original_filename}
        </p>
        <p className="text-xs text-slate-400">
          {image.width} x {image.height}
        </p>
      </div>
    </div>
  )
}
