import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react'
import {
  getDatasetStats,
  previewExport,
  exportDataset,
  ExportRequest,
} from '@/utils/api'
import { cn } from '@/utils/cn'

type ExportFormat = 'csv' | 'json' | 'coco'

const formatIcons: Record<ExportFormat, React.ReactNode> = {
  csv: <FileSpreadsheet className="w-5 h-5" />,
  json: <FileJson className="w-5 h-5" />,
  coco: <Layers className="w-5 h-5" />,
}

const formatDescriptions: Record<ExportFormat, string> = {
  csv: 'Simple CSV with columns: filename, landmark coordinates',
  json: 'JSON format with full metadata and landmark details',
  coco: 'COCO keypoint format for ML frameworks',
}

export default function DatasetBuilder() {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [split, setSplit] = useState(true)
  const [trainRatio, setTrainRatio] = useState(70)
  const [valRatio, setValRatio] = useState(15)
  const [testRatio, setTestRatio] = useState(15)
  const [minAnnotations, setMinAnnotations] = useState(19)
  const [includeImages, setIncludeImages] = useState(false)
  const [seed, setSeed] = useState(42)

  // Fetch dataset stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dataset-stats'],
    queryFn: async () => {
      const res = await getDatasetStats()
      return res.data
    },
  })

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: (request: ExportRequest) => previewExport(request).then((res) => res.data),
  })

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (request: ExportRequest) => {
      const blob = await exportDataset(request)
      // Trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cephalometric_dataset_${format}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })

  const getExportRequest = (): ExportRequest => ({
    format,
    split,
    train_ratio: trainRatio / 100,
    val_ratio: valRatio / 100,
    test_ratio: testRatio / 100,
    min_annotations: minAnnotations,
    seed,
    include_images: includeImages,
  })

  const handlePreview = () => {
    previewMutation.mutate(getExportRequest())
  }

  const handleExport = () => {
    exportMutation.mutate(getExportRequest())
  }

  const ratioSum = trainRatio + valRatio + testRatio
  const isValidRatio = ratioSum === 100

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dataset Builder</h1>
        <p className="text-slate-600 mt-1">
          Export your annotated cephalometric images for model training
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Dataset Statistics
              </h2>
              <button
                onClick={() => refetchStats()}
                className="p-1 hover:bg-slate-100 rounded"
                title="Refresh stats"
              >
                <RefreshCw className={cn('w-4 h-4', statsLoading && 'animate-spin')} />
              </button>
            </div>

            {statsLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-200 rounded" />
                ))}
              </div>
            ) : stats ? (
              <div className="space-y-3">
                <StatItem
                  label="Total Images"
                  value={stats.total_images}
                  icon={<Database className="w-4 h-4 text-slate-500" />}
                />
                <StatItem
                  label="Fully Annotated"
                  value={stats.fully_annotated}
                  icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                  highlight
                />
                <StatItem
                  label="Partially Annotated"
                  value={stats.partially_annotated}
                  icon={<AlertCircle className="w-4 h-4 text-yellow-500" />}
                />
                <StatItem
                  label="Not Annotated"
                  value={stats.not_annotated}
                  icon={<AlertCircle className="w-4 h-4 text-slate-400" />}
                />
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-green-600">
                      {stats.ready_for_export}
                    </span>{' '}
                    images ready for export
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Unable to load stats</p>
            )}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900 mb-4">Export Configuration</h2>

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['csv', 'json', 'coco'] as ExportFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      'p-3 rounded-lg border-2 text-left transition-colors',
                      format === f
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {formatIcons[f]}
                      <span className="font-medium uppercase">{f}</span>
                    </div>
                    <p className="text-xs text-slate-500">{formatDescriptions[f]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Configuration */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="split"
                  checked={split}
                  onChange={(e) => setSplit(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <label htmlFor="split" className="text-sm font-medium text-slate-700">
                  Split into Train/Val/Test sets
                </label>
              </div>

              {split && (
                <div className="grid grid-cols-3 gap-4 pl-6">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Training %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={trainRatio}
                      onChange={(e) => setTrainRatio(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Validation %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={valRatio}
                      onChange={(e) => setValRatio(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Test %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={testRatio}
                      onChange={(e) => setTestRatio(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              )}

              {split && !isValidRatio && (
                <p className="text-red-500 text-xs mt-2 pl-6">
                  Ratios must sum to 100% (currently {ratioSum}%)
                </p>
              )}
            </div>

            {/* Advanced Options */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">
                    Min. Annotations per Image
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={19}
                    value={minAnnotations}
                    onChange={(e) => setMinAnnotations(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Random Seed</label>
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeImages"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <label htmlFor="includeImages" className="text-sm text-slate-700">
                  Include image files in ZIP (larger download)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                disabled={previewMutation.isPending || (split && !isValidRatio)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
              >
                {previewMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
                Preview
              </button>
              <button
                onClick={handleExport}
                disabled={
                  exportMutation.isPending ||
                  (split && !isValidRatio) ||
                  !stats?.ready_for_export
                }
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {exportMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export Dataset
              </button>
            </div>
          </div>

          {/* Preview Results */}
          {previewMutation.data && (
            <div className="mt-4 bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Export Preview</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-600">Format</p>
                  <p className="font-medium">{previewMutation.data.metadata.format.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Images</p>
                  <p className="font-medium">{previewMutation.data.metadata.num_images}</p>
                </div>
                {previewMutation.data.metadata.split && (
                  <>
                    <div>
                      <p className="text-sm text-slate-600">Train / Val / Test</p>
                      <p className="font-medium">
                        {previewMutation.data.metadata.split.train} /{' '}
                        {previewMutation.data.metadata.split.val} /{' '}
                        {previewMutation.data.metadata.split.test}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {previewMutation.data.sample_data && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">Sample Data</p>
                  <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto max-h-48">
                    {previewMutation.data.sample_data}
                  </pre>
                </div>
              )}
            </div>
          )}

          {exportMutation.isSuccess && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">
                Dataset exported successfully! Check your downloads folder.
              </p>
            </div>
          )}

          {(previewMutation.error || exportMutation.error) && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">
                {(previewMutation.error as Error)?.message ||
                  (exportMutation.error as Error)?.message ||
                  'Export failed'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatItem({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: number
  icon?: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-slate-600">
        {icon}
        {label}
      </span>
      <span className={cn('font-semibold', highlight ? 'text-green-600' : 'text-slate-900')}>
        {value}
      </span>
    </div>
  )
}
