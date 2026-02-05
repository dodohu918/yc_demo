import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Image as ImageIcon, Activity, CheckCircle } from 'lucide-react'
import { getImages, getPredictionStatus } from '@/utils/api'

export default function Dashboard() {
  const { data: images } = useQuery({
    queryKey: ['images'],
    queryFn: () => getImages().then((r) => r.data),
  })

  const { data: mlStatus } = useQuery({
    queryKey: ['ml-status'],
    queryFn: () => getPredictionStatus().then((r) => r.data),
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ImageIcon className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Images</p>
              <p className="text-2xl font-bold">{images?.length ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Annotated</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${mlStatus?.model_loaded ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <Activity className={mlStatus?.model_loaded ? 'text-green-600' : 'text-yellow-600'} size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">ML Model</p>
              <p className="text-lg font-semibold">
                {mlStatus?.model_loaded ? 'Ready' : 'Not Loaded'}
              </p>
              {mlStatus && (
                <p className="text-xs text-slate-400">Device: {mlStatus.device}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            to="/images"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Upload Images
          </Link>
        </div>
      </div>

      {/* Recent Images */}
      {images && images.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Recent Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.slice(0, 6).map((image) => (
              <Link
                key={image.id}
                to={`/annotate/${image.id}`}
                className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
              >
                <img
                  src={`/uploads/${image.filename}`}
                  alt={image.original_filename}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm">Annotate</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
