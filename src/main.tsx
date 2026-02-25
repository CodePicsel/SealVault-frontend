
import { pdfjs } from 'react-pdf';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker to the local worker (same version as installed pdfjs-dist)
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
