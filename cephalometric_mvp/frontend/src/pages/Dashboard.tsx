import { Link } from 'react-router-dom'
import { Crosshair, MousePointer, ZoomIn } from 'lucide-react'

const DEMO_IMAGE_URL = `${import.meta.env.BASE_URL}demo_xray_1.jpg`

export default function Dashboard() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Cephalometric Landmark Annotation</h1>
      <p className="text-slate-500 mb-8">
        AI-assisted tool for marking anatomical landmarks on cephalometric X-rays.
      </p>

      {/* Demo card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="md:flex">
          {/* Demo image thumbnail */}
          <div className="md:w-64 bg-slate-900 flex-shrink-0">
            <img
              src={DEMO_IMAGE_URL}
              alt="Cephalometric X-ray Sample"
              className="w-full h-64 md:h-full object-cover opacity-90"
            />
          </div>

          {/* Info + CTA */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Try the Demo</h2>
              <p className="text-sm text-slate-600 mb-4">
                Click on a cephalometric X-ray to annotate 19 standard landmarks.
                Your annotations are saved locally in your browser.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MousePointer size={16} className="text-primary-500" />
                  Select a landmark, then click on the image to place it
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <ZoomIn size={16} className="text-primary-500" />
                  Scroll to zoom, drag to pan, adjust brightness/contrast
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Crosshair size={16} className="text-primary-500" />
                  19 standard cephalometric landmarks to annotate
                </div>
              </div>
            </div>

            <Link
              to="/demo"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Start Annotating
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
