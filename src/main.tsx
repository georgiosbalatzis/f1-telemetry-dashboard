import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DashboardContainer } from './components/DashboardContainer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DashboardContainer />
  </StrictMode>,
)
