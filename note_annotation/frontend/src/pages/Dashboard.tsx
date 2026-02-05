import { Link } from 'react-router-dom'
import { Highlighter, MousePointer, Wand2 } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Op Note Equipment Annotation</h1>
      <p className="text-slate-500 mb-8">
        AI-assisted tool for identifying surgical equipment mentioned in operative notes.
      </p>

      {/* Demo card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="md:flex">
          {/* Demo illustration */}
          <div className="md:w-64 bg-slate-900 flex-shrink-0 flex items-center justify-center p-8">
            <div className="text-center">
              <Highlighter size={64} className="text-yellow-400 mx-auto mb-3" />
              <p className="text-slate-300 text-sm">Text Annotation</p>
            </div>
          </div>

          {/* Info + CTA */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Try the Demo</h2>
              <p className="text-sm text-slate-600 mb-4">
                Read a surgical operative note and highlight all mentions of surgical equipment.
                Your annotations are saved locally in your browser.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MousePointer size={16} className="text-primary-500" />
                  Select text to highlight equipment mentions
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Highlighter size={16} className="text-primary-500" />
                  Click on a highlight to remove it
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Wand2 size={16} className="text-primary-500" />
                  Use AI Predict to auto-identify equipment
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
