import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DashboardContainer } from './components/DashboardContainer'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Outermost net: an error in the container's own effects or handlers must not leave a blank page (Safari throws on URL updates). */}
    <ErrorBoundary label="Dashboard">
      <DashboardContainer />
    </ErrorBoundary>
  </StrictMode>,
)
