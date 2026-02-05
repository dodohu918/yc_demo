import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AnnotationPage from './pages/AnnotationPage'
import ImagesPage from './pages/ImagesPage'
import DatasetBuilder from './pages/DatasetBuilder'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="images" element={<ImagesPage />} />
          <Route path="datasets" element={<DatasetBuilder />} />
          <Route path="annotate/:imageId" element={<AnnotationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
