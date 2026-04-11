import { Sun } from 'lucide-react';
import { CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Weather } from '../../api/openf1';
import { COLORS } from '../../constants/colors';
import type { WeatherRadarPoint, WeatherTrendPoint } from './types';
import { CardGridSkeleton, ChartSkeleton, ChartTip, Err, NoData, Stat } from './shared';
import { ChartPanel } from './ChartPanel';

type Props = {
  loading: boolean;
  error: string | null;
  latestWeather: OpenF1Weather | null;
  sampleCount: number;
  weatherRadar: WeatherRadarPoint[];
  weatherTrend: WeatherTrendPoint[];
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
  onRetry?: () => void;
};

export function WeatherTab({ loading, error, latestWeather, sampleCount, weatherRadar, weatherTrend, embedMode = false, onEmbedPanel, onRetry }: Props) {
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
      <>
        <CardGridSkeleton count={4} label="Loading weather readings..." />
        <CardGridSkeleton count={4} label="Loading weather summary..." />
        <ChartPanel title="Conditions Trend" icon={<Sun size={14} style={{ color: 'var(--accent-strong)' }} />} sub="Loading session weather samples" exportName="conditions-trend" legend={weatherLegend} panelId="weather-trend" embedMode={embedMode} onEmbedPanel={onEmbedPanel}>
          <ChartSkeleton label="Loading weather chart..." className="h-[180px] sm:h-[260px]" />
        </ChartPanel>
      </>
    );
  }
  if (error) return <Err msg={error} onAction={onRetry} />;
  if (!latestWeather) return <NoData msg="No weather data for this session." />;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Air Temperature" value={latestWeather.air_temperature.toFixed(1)} unit="°C" color={COLORS.weather.air} />
        <Stat label="Track Temperature" value={latestWeather.track_temperature.toFixed(1)} unit="°C" color={COLORS.weather.track} />
        <Stat label="Humidity" value={latestWeather.humidity.toFixed(0)} unit="%" color={COLORS.weather.humidity} />
        <Stat label="Wind Speed" value={latestWeather.wind_speed.toFixed(1)} unit="m/s" color={COLORS.weather.wind} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pressure" value={latestWeather.pressure.toFixed(0)} unit="mbar" />
        <Stat label="Rainfall" value={latestWeather.rainfall ? 'Yes' : 'No'} color={latestWeather.rainfall ? COLORS.weather.humidity : COLORS.success} />
        <Stat label="Wind Direction" value={latestWeather.wind_direction.toFixed(0)} unit="°" />
        <Stat label="Weather Samples" value={sampleCount} />
      </div>
      <ChartPanel title="Conditions Radar" icon={<Sun size={14} style={{ color: 'var(--accent)' }} />} sub="Session snapshot normalized to radar axes" exportName="conditions-radar" legend={[{ label: 'Conditions', color: 'var(--accent)', variant: 'area' }]} panelId="weather-radar" embedMode={embedMode} onEmbedPanel={onEmbedPanel}>
        <div className="h-[220px] sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={weatherRadar} outerRadius="70%">
              <PolarGrid stroke={chartGrid} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: chartAxis, fontSize: 10 }} />
              <Radar name="Conditions" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </ChartPanel>
      <ChartPanel title="Conditions Trend" icon={<Sun size={14} style={{ color: 'var(--accent-strong)' }} />} sub="Downsampled timeline across the current session" exportName="conditions-trend" legend={weatherLegend} panelId="weather-trend" embedMode={embedMode} onEmbedPanel={onEmbedPanel}>
        {weatherTrend.length > 1 ? (
          <div className="h-[180px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weatherTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
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
    </>
  );
}
