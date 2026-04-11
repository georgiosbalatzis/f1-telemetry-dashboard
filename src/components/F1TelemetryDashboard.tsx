/**
 * F1TelemetryDashboard — entry point component.
 *
 * All data coordination lives in DashboardContainer.
 * All UI rendering lives in DashboardShell.
 */

import { DashboardContainer } from './DashboardContainer';

export default function F1TelemetryDashboard() {
  return <DashboardContainer />;
}
