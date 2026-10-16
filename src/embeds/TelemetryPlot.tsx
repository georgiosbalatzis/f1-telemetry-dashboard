import { useEffect, useRef, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, LineChart, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { COLORS } from '../constants/colors';
import { AXIS_TICK, AXIS_TICK_SOFT, CHART_MARGIN, PEDAL_TICKS, PROGRESS_TICKS, evenTicks, formatPedalAxis } from '../components/dashboard/chartAxis';
import type { FigureData, FigureTheme } from './contract';
import { plotDriverColour, plotId } from './plotModel';

type Props = { data: FigureData; width: number; height?: number; theme?: FigureTheme; colours?: Record<number, string>; axisFontSize?: number };

function FigureTooltip({ active, payload, label, unit, prefix, suffix, absolute, binaryBrake }: { active?: boolean; payload?: { color?: string; name?: string; value?: unknown }[]; label?: string | number; unit: string; prefix: string; suffix: string; absolute?: boolean; binaryBrake?: boolean }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><div className="tooltip-label">{prefix}{label}{suffix}</div>{payload.map((item, index) => {
    const value = binaryBrake && /brake/i.test(item.name ?? '') && typeof item.value === 'number' ? item.value === 0 ? 'OFF' : 'ON' : typeof item.value === 'number' ? (absolute ? Math.abs(item.value) : item.value).toFixed(1).replace(/\.0$/, '') : String(item.value ?? '');
    return <div key={index} className="tooltip-row"><span className="driver-marker" style={{ backgroundColor: item.color }} /><span>{item.name}</span><strong>{value}{unit}</strong></div>;
  })}</div>;
}

function PedalHalvesLabel({ viewBox, fontSize = AXIS_TICK_SOFT.fontSize }: { viewBox?: { x: number; y: number; height: number }; fontSize?: number }) {
  if (!viewBox) return null;
  const x = viewBox.x + AXIS_TICK_SOFT.fontSize;
  return <g fill={AXIS_TICK_SOFT.fill} fontSize={fontSize} textAnchor="middle">
    {[['Throttle', 0.25], ['Brake', 0.75]].map(([text, share]) => {
      const y = viewBox.y + viewBox.height * (share as number);
      return <text key={text} x={x} y={y} transform={`rotate(-90 ${x} ${y})`}>{text}</text>;
    })}
  </g>;
}

/** Pure, explicitly sized plot. No page selection, providers, API calls or document theme reads. */
export function TelemetryPlot({ data, width, height, theme = 'light', colours, axisFontSize = AXIS_TICK.fontSize }: Props) {
  const distance = data.axis === 'distance';
  const progress = data.axis !== 'sample';
  const speed = data.kind === 'speed';
  const tickCount = width < 640 ? 5 : 10;
  const named = !distance && progress && data.guides.length > 0;
  const xKey = distance ? 'distance' : progress ? 'progress' : 'idx';
  const ticks = distance ? undefined : named ? evenTicks(data.guides.map((guide) => guide.progress), tickCount)
    : progress ? PROGRESS_TICKS : evenTicks(data.points.map((point) => point.idx as number), tickCount);
  const plotHeight = height ?? (speed ? (width < 640 ? 240 : 380) : progress ? (width < 640 ? 160 : 200) : (width < 640 ? 140 : 180));
  const Chart = !speed && !progress ? ComposedChart : LineChart;
  const tickStyle = { ...AXIS_TICK, fontSize: axisFontSize };
  const softTickStyle = { ...AXIS_TICK_SOFT, fontSize: axisFontSize };
  if (width <= 0) return null;
  return <Chart width={width} height={plotHeight} data={data.points} margin={distance ? { ...CHART_MARGIN, right: 32, bottom: 16 } : CHART_MARGIN}>
    <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
    <XAxis dataKey={xKey} ticks={ticks} interval={0} tick={tickStyle} stroke="var(--chart-grid)"
      {...(distance ? { type: 'number' as const, domain: data.distanceAxis!.domain, allowDataOverflow: true, label: { value: 'Distance (m)', position: 'insideBottom', offset: -4, ...softTickStyle } } : progress ? { type: 'number' as const, domain: [0, 100], unit: named ? undefined : '%', tickFormatter: named ? (value: number) => data.guides.find((guide) => guide.progress === value)?.label ?? '' : undefined } : {})} />
    {speed ? <YAxis domain={distance ? data.distanceAxis!.speedDomain : [0, 370]} ticks={distance ? data.distanceAxis!.speedTicks : [0, 100, 200, 300]} allowDataOverflow={distance} tick={tickStyle} stroke="var(--chart-grid)" label={{ value: 'km/h', angle: -90, position: 'insideLeft', ...softTickStyle }} />
      : <YAxis domain={[-105, 105]} ticks={PEDAL_TICKS} tick={tickStyle} stroke="var(--chart-grid)" label={<PedalHalvesLabel fontSize={axisFontSize} />} tickFormatter={distance ? (value: number) => value < 0 ? value === -100 ? 'ON' : '' : String(value) : formatPedalAxis} />}
    {!speed && <ReferenceLine y={0} stroke="var(--chart-reference)" strokeDasharray="4 4" />}
    {distance && data.distanceAxis!.corners.filter(corner => ['T1', 'T3'].includes(corner.label) && corner.start >= data.distanceAxis!.domain[0] && corner.end <= data.distanceAxis!.domain[1]).map(corner => <ReferenceArea key={corner.label} x1={corner.start} x2={corner.end} fill="var(--chart-reference)" fillOpacity={0.06} />)}
    {progress && data.guides.map((guide) => <ReferenceLine key={guide.progress} x={guide.progress} stroke="var(--chart-grid)" strokeDasharray="2 4" label={distance && (['T1', 'T3'].includes(guide.label) || data.distanceAxis!.domain[1] - data.distanceAxis!.domain[0] < 1000) ? { value: guide.label, position: 'insideTopRight', ...softTickStyle, dy: guide.label === 'T3' && data.distanceAxis!.domain[1] - data.distanceAxis!.domain[0] > 1000 ? 22 : 0 } : undefined} />)}
    <Tooltip content={<FigureTooltip binaryBrake={distance && !speed} unit={speed ? ' km/h' : distance ? '' : '%'} absolute={!speed} prefix={distance ? 'Distance · ' : progress ? 'Lap progress · ' : 'Sample · '} suffix={distance ? ' m' : progress ? '%' : ''} />} />
    {progress ? (speed ? ['speed'] : ['throttle', 'brake']).flatMap((channel) => data.drivers.map((driver) => (
      <Line key={`${channel}-${plotId(driver)}`} type={distance ? channel === 'brake' ? 'stepAfter' : 'linear' : 'monotone'} dataKey={`${channel}_${plotId(driver)}`} stroke={plotDriverColour(data, plotId(driver), theme, colours)}
        strokeDasharray={channel === 'brake' ? driver.brakeDash : driver.lineDash} strokeWidth={channel === 'brake' ? 1.6 : 2} dot={false} connectNulls={!distance} isAnimationActive={false}
        name={speed ? driver.acronym : `${driver.acronym} ${channel === 'throttle' ? distance ? 'Throttle (%)' : 'Throttle' : distance ? 'Brake on/off' : 'Brake'}`} />
    ))) : speed ? <Line type="monotone" dataKey="speed" stroke={plotDriverColour(data, data.drivers[0].number, theme, colours)} strokeDasharray={data.drivers[0].lineDash} strokeWidth={1.8} dot={false} isAnimationActive={false} name="Speed (km/h)" />
      : ['throttle', 'brake'].map((channel) => <Area key={channel} type="monotone" dataKey={channel} stroke={channel === 'throttle' ? COLORS.success : COLORS.danger} fill={channel === 'throttle' ? COLORS.success : COLORS.danger} fillOpacity={0.08} strokeWidth={1.5} isAnimationActive={false} name={channel === 'throttle' ? 'Throttle %' : 'Brake'} />)}
  </Chart>;
}

/** Dashboard adapter: measures this chart's container, including split mode and inline article columns. */
export function ResponsiveTelemetryPlot(props: Omit<Props, 'width'>) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} style={{ width: '100%', minWidth: 0 }}><TelemetryPlot {...props} width={width} /></div>;
}
