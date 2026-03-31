import { Sun } from 'lucide-react';
import { CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Weather } from '../../api/openf1';
import type { WeatherRadarPoint, WeatherTrendPoint } from './types';
import { ChartTip, Err, NoData, Panel, Spinner, Stat } from './shared';

type Props = {
  loading: boolean;
  error: string | null;
  latestWeather: OpenF1Weather | null;
  sampleCount: number;
  weatherRadar: WeatherRadarPoint[];
  weatherTrend: WeatherTrendPoint[];
};

export function WeatherTab({ loading, error, latestWeather, sampleCount, weatherRadar, weatherTrend }: Props) {
  if (loading) return <Spinner />;
  if (error) return <Err msg={error} />;
  if (!latestWeather) return <NoData msg="No weather data for this session." />;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Air Temperature" value={latestWeather.air_temperature.toFixed(1)} unit="°C" color="#EF4444" />
        <Stat label="Track Temperature" value={latestWeather.track_temperature.toFixed(1)} unit="°C" color="#F97316" />
        <Stat label="Humidity" value={latestWeather.humidity.toFixed(0)} unit="%" color="#3B82F6" />
        <Stat label="Wind Speed" value={latestWeather.wind_speed.toFixed(1)} unit="m/s" color="#06B6D4" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pressure" value={latestWeather.pressure.toFixed(0)} unit="mbar" />
        <Stat label="Rainfall" value={latestWeather.rainfall ? 'Yes' : 'No'} color={latestWeather.rainfall ? '#3B82F6' : '#22C55E'} />
        <Stat label="Wind Direction" value={latestWeather.wind_direction.toFixed(0)} unit="°" />
        <Stat label="Weather Samples" value={sampleCount} />
      </div>
      <Panel title="Conditions Radar" icon={<Sun size={14} className="text-yellow-400" />}>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={weatherRadar} outerRadius="70%">
            <PolarGrid stroke="#ffffff08" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10 }} />
            <Radar name="Conditions" dataKey="value" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.12} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Conditions Trend" icon={<Sun size={14} className="text-cyan-400" />} sub="Downsampled timeline across the current session">
        {weatherTrend.length > 1 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weatherTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="time" tick={{ fill: '#666', fontSize: 10 }} stroke="#ffffff06" interval={Math.max(0, Math.floor(weatherTrend.length / 6))} />
              <YAxis yAxisId="temp" tick={{ fill: '#666', fontSize: 10 }} stroke="#ffffff06" />
              <YAxis yAxisId="aux" orientation="right" tick={{ fill: '#444', fontSize: 9 }} stroke="#ffffff04" />
              <Tooltip content={<ChartTip />} />
              <Line yAxisId="temp" type="monotone" dataKey="air" stroke="#EF4444" strokeWidth={2} dot={false} name="Air °C" />
              <Line yAxisId="temp" type="monotone" dataKey="track" stroke="#F97316" strokeWidth={2} dot={false} name="Track °C" />
              <Line yAxisId="aux" type="monotone" dataKey="humidity" stroke="#3B82F6" strokeWidth={1.6} dot={false} name="Humidity %" />
              <Line yAxisId="aux" type="monotone" dataKey="wind" stroke="#06B6D4" strokeWidth={1.6} dot={false} name="Wind m/s" />
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="More weather samples are needed to draw a session trend." />}
      </Panel>
    </>
  );
}
