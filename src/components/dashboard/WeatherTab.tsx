import { Sun } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Weather } from '../../api/openf1';
import { COLORS } from '../../constants/colors';
import type { WeatherTrendPoint } from './types';
import { PanelSelection, CardGridSkeleton, ChartSkeleton, ChartTip, Err, NoData, Stat } from './shared';
import { ChartPanel } from './ChartPanel';

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
  const chartAxis = 'var(--chart-axis)';
  const chartAxisSoft = 'var(--chart-axis-soft)';
  const weatherLegend = [
    { label: 'Air °C', color: COLORS.weather.air },
    { label: 'Track °C', color: COLORS.weather.track },
    { label: 'Humidity %', color: COLORS.weather.humidity },
    { label: 'Wind m/s', color: COLORS.weather.wind },
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
          <div className="h-[180px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weatherTrend}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="time" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} interval={Math.max(0, Math.floor(weatherTrend.length / 6))} />
                <YAxis yAxisId="temp" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
                <YAxis yAxisId="aux" orientation="right" tick={{ fill: chartAxisSoft, fontSize: 9 }} stroke={chartGrid} />
                <Tooltip content={<ChartTip />} />
                <Line yAxisId="temp" type="monotone" dataKey="air" stroke={COLORS.weather.air} strokeWidth={2} dot={false} isAnimationActive={false} name="Air °C" />
                <Line yAxisId="temp" type="monotone" dataKey="track" stroke={COLORS.weather.track} strokeWidth={2} dot={false} isAnimationActive={false} name="Track °C" />
                <Line yAxisId="aux" type="monotone" dataKey="humidity" stroke={COLORS.weather.humidity} strokeWidth={1.6} dot={false} isAnimationActive={false} name="Humidity %" />
                <Line yAxisId="aux" type="monotone" dataKey="wind" stroke={COLORS.weather.wind} strokeWidth={1.6} dot={false} isAnimationActive={false} name="Wind m/s" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="More weather samples are needed to draw a session trend." />}
      </ChartPanel>
      <p className="weather-metadata">
        Humidity {latestWeather.humidity.toFixed(0)}% · Wind {latestWeather.wind_speed.toFixed(1)} m/s at {latestWeather.wind_direction.toFixed(0)}° · Pressure {latestWeather.pressure.toFixed(0)} mbar · {sampleCount} samples
      </p>
    </PanelSelection>
  );
}
