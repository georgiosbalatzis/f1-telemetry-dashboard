import { Sun } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Weather } from '../../api/openf1';
import { COLORS } from '../../constants/colors';
import type { WeatherTrendPoint } from './types';
import { PanelSelection, CardGridSkeleton, ChartSkeleton, ChartTip, Err, NoData, Stat } from './shared';
import { ChartPanel } from './ChartPanel';
import { AXIS_TICK, AXIS_TICK_SOFT, CHART_MARGIN, evenTicks, useXTickCount } from './chartAxis';

/** One shared Y-axis width keeps the three stacked plots aligned on the same time axis. */
const WEATHER_AXIS_WIDTH = 48;
const AUX_TRACES = [
  { key: 'humidity', name: 'Humidity', unit: '%', tickUnit: '%', color: COLORS.weather.humidity },
  { key: 'wind', name: 'Wind', unit: 'm/s', tickUnit: ' m/s', color: COLORS.weather.wind },
] as const;

type Props = {
  loading: boolean;
  error: string | null;
  latestWeather: OpenF1Weather | null;
  sampleCount: number;
  weatherTrend: WeatherTrendPoint[];
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
  onRetry?: () => void;
};

export function WeatherTab({ loading, error, latestWeather, sampleCount, weatherTrend, embedMode = false, onEmbedPanel, onRetry }: Props) {
  const chartGrid = 'var(--chart-grid)';
  const timeTicks = evenTicks(weatherTrend.map((point) => point.time), useXTickCount());
  const weatherLegend = [
    { label: 'Air °C', color: COLORS.weather.air },
    { label: 'Track °C', color: COLORS.weather.track },
  ];

  if (loading) {
    return (
      <PanelSelection embedMode={embedMode}>
        <CardGridSkeleton count={3} label="Loading weather readings..." />
        <ChartPanel title="Conditions Trend" icon={<Sun size={14} style={{ color: 'var(--accent-strong)' }} />} sub="Loading session weather samples" exportName="conditions-trend" legend={weatherLegend} panelId="weather-trend" embedMode={embedMode} onEmbedPanel={onEmbedPanel}>
          <ChartSkeleton label="Loading weather chart..." className="h-[180px] sm:h-[260px]" />
        </ChartPanel>
      </PanelSelection>
    );
  }
  if (error) return <Err msg={error} onAction={onRetry} />;
  if (!latestWeather) return <NoData msg="No weather data for this session." />;

  return (
    <PanelSelection embedMode={embedMode}>
      <div className="weather-primary">
        <Stat label="Track Temperature" value={latestWeather.track_temperature.toFixed(1)} unit="°C" />
        <Stat label="Air Temperature" value={latestWeather.air_temperature.toFixed(1)} unit="°C" />
        <Stat label="Rainfall" value={latestWeather.rainfall ? 'Yes' : 'No'} />
      </div>
      <ChartPanel title="Conditions Trend" icon={<Sun size={14} style={{ color: 'var(--accent-strong)' }} />} sub="Downsampled timeline across the current session" exportName="conditions-trend" legend={weatherLegend} panelId="weather-trend" embedMode={embedMode} onEmbedPanel={onEmbedPanel}>
        {weatherTrend.length > 1 ? (
          <>
            <div className="h-[150px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weatherTrend} margin={CHART_MARGIN} syncId="weather-trend">
                  <CartesianGrid vertical={false} stroke={chartGrid} />
                  <XAxis dataKey="time" ticks={timeTicks} interval={0} hide />
                  <YAxis width={WEATHER_AXIS_WIDTH} allowDecimals={false} tick={AXIS_TICK} tickFormatter={(value: number) => `${value}°C`} stroke={chartGrid} />
                  <Tooltip content={<ChartTip unit="°C" />} />
                  <Line type="monotone" dataKey="air" stroke={COLORS.weather.air} strokeWidth={2} dot={false} isAnimationActive={false} name="Air" />
                  <Line type="monotone" dataKey="track" stroke={COLORS.weather.track} strokeWidth={2} dot={false} isAnimationActive={false} name="Track" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {AUX_TRACES.map((trace, index) => (
              <div key={trace.key} className="mt-3">
                <div className="text-[10px] uppercase tracking-[0.06em] text-[color:var(--text-muted)]">{trace.name} <span className="normal-case">({trace.unit})</span></div>
                <div className={index === AUX_TRACES.length - 1 ? 'h-[88px] sm:h-[104px]' : 'h-[64px] sm:h-[80px]'}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weatherTrend} margin={CHART_MARGIN} syncId="weather-trend">
                      <CartesianGrid vertical={false} stroke={chartGrid} />
                      <XAxis dataKey="time" ticks={timeTicks} interval={0} tick={AXIS_TICK} stroke={chartGrid} hide={index !== AUX_TRACES.length - 1} />
                      <YAxis width={WEATHER_AXIS_WIDTH} domain={['auto', 'auto']} tickCount={3} allowDecimals={false} tick={AXIS_TICK_SOFT} tickFormatter={(value: number) => `${value}${trace.tickUnit}`} stroke={chartGrid} />
                      <Tooltip content={<ChartTip unit={trace.unit} />} />
                      <Line type="monotone" dataKey={trace.key} stroke={trace.color} strokeWidth={1.6} dot={false} isAnimationActive={false} name={trace.name} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </>
        ) : <NoData msg="More weather samples are needed to draw a session trend." />}
      </ChartPanel>
      <p className="weather-metadata">
        Humidity {latestWeather.humidity.toFixed(0)}% · Wind {latestWeather.wind_speed.toFixed(1)} m/s at {latestWeather.wind_direction.toFixed(0)}° · Pressure {latestWeather.pressure.toFixed(0)} mbar · {sampleCount} samples
      </p>
    </PanelSelection>
  );
}
