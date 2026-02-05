import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wand2, X, Sparkles } from 'lucide-react'
import { useAnnotationStore, type Highlight } from '@/hooks/useAnnotationStore'

// Sample operative note text
const OP_NOTE_TEXT = `OPERATIVE NOTE

PROCEDURE: Laparoscopic Cholecystectomy

INDICATION: The patient is a 45-year-old female presenting with symptomatic cholelithiasis and recurrent biliary colic. After informed consent was obtained, the patient was brought to the operating room.

DESCRIPTION OF PROCEDURE: The patient was placed in supine position on the operating table. General anesthesia was induced and a Foley catheter was placed for bladder decompression. The abdomen was prepped and draped in the usual sterile fashion. A Veress needle was inserted at the umbilicus to establish pneumoperitoneum to 15 mmHg using a CO2 insufflator. A 12-mm trocar was placed at the umbilicus for the laparoscope. Under direct visualization, three additional trocars were placed: a 10-mm trocar in the epigastric region and two 5-mm trocars in the right upper quadrant.

The laparoscope with a 30-degree lens was introduced and the abdominal cavity was inspected. The gallbladder was identified and grasped with an atraumatic grasper through the lateral 5-mm port. The infundibulum was retracted laterally using a Maryland dissector through the medial 5-mm port. The Triangle of Calot was carefully dissected using a hook electrocautery device and L-shaped hook cautery. The cystic duct and cystic artery were identified, doubly clipped with medium-large titanium clips using a clip applier, and divided with Metzenbaum scissors.

The gallbladder was then dissected from the liver bed using the hook electrocautery device in a retrograde fashion. Hemostasis was confirmed and the liver bed was inspected. The gallbladder was placed in an endoscopic retrieval bag and extracted through the umbilical port site. The specimen was sent to pathology.

The operative field was irrigated with warm normal saline using a suction-irrigator device. Final inspection revealed adequate hemostasis with no evidence of bile leak. The trocars were removed under direct visualization. The fascia at the umbilical port site was closed with 0 Vicryl suture using a Carter-Thomason needle closure device. The skin incisions were closed with 4-0 Monocryl subcuticular sutures and reinforced with Steri-Strips. Sterile dressings were applied.

The patient tolerated the procedure well and was transferred to the post-anesthesia care unit in stable condition. Estimated blood loss was minimal. No complications were encountered.`

// Ground truth: equipment mentions with their character offsets in OP_NOTE_TEXT
// Each entry is [startOffset, endOffset, displayText]
const GROUND_TRUTH: Array<[number, number, string]> = [
  [400, 414, 'Foley catheter'],
  [509, 522, 'Veress needle'],
  [592, 606, 'CO2 insufflator'],
  [610, 621, '12-mm trocar'],
  [653, 664, 'laparoscope'],
  [727, 738, '10-mm trocar'],
  [775, 787, '5-mm trocars'],
  [821, 832, 'laparoscope'],
  [840, 855, '30-degree lens'],
  [935, 954, 'atraumatic grasper'],
  [968, 980, '5-mm port'],
  // Note: overlaps handled by taking first match
  [1032, 1050, 'Maryland dissector'],
  [1065, 1077, '5-mm port'],
  [1124, 1150, 'hook electrocautery device'],
  [1155, 1175, 'L-shaped hook cautery'],
  [1249, 1263, 'titanium clips'],
  [1272, 1284, 'clip applier'],
  [1304, 1324, 'Metzenbaum scissors'],
  [1375, 1401, 'hook electrocautery device'],
  [1490, 1512, 'endoscopic retrieval bag'],
  [1604, 1629, 'suction-irrigator device'],
  [1827, 1840, 'Vicryl suture'],
  [1849, 1883, 'Carter-Thomason needle closure device'],
  [1922, 1945, '4-0 Monocryl subcuticular'],
  [1946, 1953, 'sutures'],
  [1974, 1986, 'Steri-Strips'],
  [1988, 2005, 'Sterile dressings'],
]

let nextHighlightId = 1

export default function DemoAnnotationPage() {
  const navigate = useNavigate()
  const [isPredicting, setIsPredicting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const textContainerRef = useRef<HTMLDivElement>(null)

  const { highlights, addHighlight, removeHighlight, setHighlights, clearHighlights } =
    useAnnotationStore()

  // Load saved highlights from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('opnote_highlights')
      if (saved) {
        const parsed: Highlight[] = JSON.parse(saved)
        setHighlights(parsed)
        nextHighlightId = parsed.length + 1
      }
    } catch {
      // ignore
    }
    return () => clearHighlights()
  }, [setHighlights, clearHighlights])

  // Save highlights to localStorage whenever they change
  useEffect(() => {
    if (highlights.length > 0) {
      localStorage.setItem('opnote_highlights', JSON.stringify(highlights))
    } else {
      localStorage.removeItem('opnote_highlights')
    }
  }, [highlights])

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !textContainerRef.current) return

    const range = selection.getRangeAt(0)
    const container = textContainerRef.current

    // Calculate offsets relative to the plain text
    const preRange = document.createRange()
    preRange.selectNodeContents(container)
    preRange.setEnd(range.startContainer, range.startOffset)
    const startOffset = preRange.toString().length

    const selectedText = range.toString().trim()
    if (!selectedText) return

    const endOffset = startOffset + range.toString().length

    // Check for overlapping highlights
    const overlaps = highlights.some(
      (h) => startOffset < h.endOffset && endOffset > h.startOffset
    )
    if (overlaps) {
      selection.removeAllRanges()
      return
    }

    const highlight: Highlight = {
      id: `hl-${nextHighlightId++}`,
      startOffset,
      endOffset,
      text: selectedText,
      source: 'manual',
    }

    addHighlight(highlight)
    selection.removeAllRanges()
  }, [highlights, addHighlight])

  // Handle clicking on a highlight to remove it
  const handleHighlightClick = useCallback(
    (id: string) => {
      removeHighlight(id)
    },
    [removeHighlight]
  )

  // AI predict — highlight ground truth equipment
  const handlePredict = useCallback(async () => {
    if (isPredicting) return
    setIsPredicting(true)

    // Simulate model inference delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    let added = 0
    for (const [start, end, text] of GROUND_TRUTH) {
      // Skip if already covered by an existing highlight
      const alreadyCovered = highlights.some(
        (h) => start < h.endOffset && end > h.startOffset
      )
      if (alreadyCovered) continue

      const highlight: Highlight = {
        id: `ai-${nextHighlightId++}`,
        startOffset: start,
        endOffset: end,
        text,
        source: 'ai_predicted',
      }
      addHighlight(highlight)
      added++
    }

    setIsPredicting(false)
    setToastMessage(
      added > 0
        ? `AI identified ${added} equipment mention${added > 1 ? 's' : ''}`
        : 'All equipment already annotated!'
    )
    setTimeout(() => setToastMessage(null), 4000)
  }, [isPredicting, highlights, addHighlight])

  // Render text with highlights
  const renderAnnotatedText = () => {
    const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset)
    const parts: JSX.Element[] = []
    let lastIndex = 0

    for (const hl of sorted) {
      // Add un-highlighted text before this highlight
      if (hl.startOffset > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {OP_NOTE_TEXT.slice(lastIndex, hl.startOffset)}
          </span>
        )
      }

      // Add highlighted text
      parts.push(
        <span
          key={hl.id}
          onClick={() => handleHighlightClick(hl.id)}
          className={`cursor-pointer rounded px-0.5 transition-colors ${
            hl.source === 'ai_predicted'
              ? 'bg-yellow-200 border-b-2 border-purple-400 hover:bg-yellow-300'
              : 'bg-yellow-200 hover:bg-yellow-300'
          }`}
          title="Click to remove highlight"
        >
          {OP_NOTE_TEXT.slice(hl.startOffset, hl.endOffset)}
        </span>
      )

      lastIndex = hl.endOffset
    }

    // Add remaining text
    if (lastIndex < OP_NOTE_TEXT.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{OP_NOTE_TEXT.slice(lastIndex)}</span>
      )
    }

    return parts
  }

  const manualCount = highlights.filter((h) => h.source === 'manual').length
  const aiCount = highlights.filter((h) => h.source === 'ai_predicted').length

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-semibold text-lg">Operative Note — Equipment Annotation</h1>
            <p className="text-sm text-slate-500">
              {highlights.length} equipment item{highlights.length !== 1 ? 's' : ''} highlighted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePredict}
            disabled={isPredicting}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            title="Run AI prediction"
          >
            <Wand2 size={18} />
            {isPredicting ? 'Predicting...' : 'AI Predict'}
          </button>
        </div>
      </header>

      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4 max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-amber-500">
              <Wand2 size={20} />
            </div>
            <div>
              <h4 className="font-medium text-amber-800">AI Predictions Complete</h4>
              <p className="text-sm text-amber-700 mt-1">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="flex-shrink-0 text-amber-400 hover:text-amber-600"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Text area */}
        <div className="flex-1 overflow-auto bg-slate-50 p-8">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Task:</strong> Read the operative note below and highlight all mentions of
                surgical equipment by selecting the text. Click on a highlight to remove it.
              </p>
            </div>
            <div
              ref={textContainerRef}
              onMouseUp={handleMouseUp}
              className="text-base leading-relaxed text-slate-700 whitespace-pre-line select-text cursor-text"
            >
              {renderAnnotatedText()}
            </div>
          </div>
        </div>

        {/* Sidebar — equipment list */}
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Equipment Found</h2>
            <p className="text-sm text-slate-500 mt-1">
              {highlights.length} item{highlights.length !== 1 ? 's' : ''} annotated
            </p>
            {aiCount > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                <Sparkles size={12} />
                {aiCount} AI prediction{aiCount > 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-2">
            {highlights.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">
                No equipment highlighted yet. Select text in the op note to start annotating.
              </div>
            ) : (
              [...highlights]
                .sort((a, b) => a.startOffset - b.startOffset)
                .map((hl) => (
                  <div
                    key={hl.id}
                    className="flex items-center justify-between px-3 py-2 mb-1 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          hl.source === 'ai_predicted' ? 'bg-purple-500' : 'bg-yellow-400'
                        }`}
                      />
                      <span className="text-sm text-slate-700 truncate">{hl.text}</span>
                      {hl.source === 'ai_predicted' && (
                        <span className="text-xs text-purple-500 flex-shrink-0">AI</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeHighlight(hl.id)}
                      className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      title="Remove highlight"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500">
              <strong>Select</strong> text to highlight equipment.{' '}
              <strong>Click</strong> a highlight to remove it.
            </p>
            {highlights.length > 0 && (
              <div className="mt-2 text-xs text-slate-400">
                {manualCount > 0 && (
                  <span className="inline-flex items-center gap-1 mr-3">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                    {manualCount} manual
                  </span>
                )}
                {aiCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                    {aiCount} AI
                  </span>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
