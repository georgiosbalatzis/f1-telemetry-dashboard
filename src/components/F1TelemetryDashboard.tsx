import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ReferenceLine, ReferenceDot, ReferenceArea, Brush
} from 'recharts';
import {
  Sun, Flag, Zap, Activity, Headphones,
  Gauge, Timer, CircleDot, Loader2, Radio, ChevronLeft, ChevronRight, ChevronDown,
  Keyboard, Download, Search, ChevronUp,
  Star, Share2, CloudRain, SkipForward, SkipBack,
  FastForward, Columns, Trophy, X
} from 'lucide-react';
import {
  useMeetings, useSessions, useDrivers, useLaps, useLapTelemetry,
  useLapLocation, useStints, usePits, useWeather, useRaceControl, useTeamRadio,
  useAutoRefresh, usePositions
} from '../hooks/useOpenF1';
import { usePersistedSelections, useBookmarks, buildShareUrl } from '../hooks/usePersist';
import { isSessionPotentiallyLive } from '../api/openf1';
import type { OpenF1Driver, OpenF1Lap, OpenF1Stint, OpenF1Session } from '../api/openf1';
import {
  cn, fmtLap, fmtDelta, downloadCSV, CC, useToasts,
  Spinner, Err, NoData, AnimStat, Panel, ChartSkeleton, TableSkeleton,
  LoadProgress, FullscreenModal, DriverChip, ChartTip, SegmentBars,
  HeatTrackMap, VirtualList, useDebouncedHover, Select
} from './ui/shared';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'telemetry' | 'tires' | 'energy' | 'radio' | 'incidents' | 'weather';
const TABS: { key: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { key: 'telemetry', label: 'Telemetry', shortLabel: 'Telem', icon: <Activity size={14} /> },
  { key: 'tires', label: 'Tyres & Strategy', shortLabel: 'Tyres', icon: <CircleDot size={14} /> },
  { key: 'energy', label: 'DRS & Gears', shortLabel: 'DRS', icon: <Zap size={14} /> },
  { key: 'radio', label: 'Team Radio', shortLabel: 'Radio', icon: <Radio size={14} /> },
  { key: 'incidents', label: 'Race Control', shortLabel: 'RC', icon: <Flag size={14} /> },
  { key: 'weather', label: 'Weather', shortLabel: 'Wx', icon: <Sun size={14} /> },
];

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function F1TelemetryDashboard() {
  const { initial: saved, persist } = usePersistedSelections();
  const { bookmarks, toggle: toggleBookmark, isBookmarked } = useBookmarks();
  const { toasts, show: showToast } = useToasts();

  const [year, setYear] = useState(saved.year || new Date().getFullYear());
  const [circuit, setCircuit] = useState<string|null>(saved.circuit ?? null);
  const [sessionKey, setSessionKey] = useState<number|null>(saved.sessionKey ?? null);
  const [driverNums, setDriverNums] = useState<number[]>(saved.driverNums || []);
  const [lapNum, setLapNum] = useState(saved.lapNum || 1);
  const [tab, setTab] = useState<Tab>((saved.tab as Tab) || 'telemetry');
  const [tab2, setTab2] = useState<Tab|null>(null);
  const [showKbHints, setShowKbHints] = useState(false);
  const [driversCollapsed, setDriversCollapsed] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState<string|null>(null);
  const [rcFilter, setRcFilter] = useState('');
  const [rcFlagFilter, setRcFlagFilter] = useState<string|null>(null);

  const { hoverIdx: chartHoverIdx, onMove: onChartMove, onLeave: onChartLeave } = useDebouncedHover();

  const restoredRef = useRef({ circuit: !!saved.circuit, session: !!saved.sessionKey, drivers: !!(saved.driverNums?.length) });

  useEffect(() => { persist({ year, circuit, sessionKey, driverNums, lapNum, tab }); }, [year, circuit, sessionKey, driverNums, lapNum, tab, persist]);

  // ── Data fetching
  const meetings = useMeetings(year);
  const sessions = useSessions(year, circuit);
  const currentSession = useMemo<OpenF1Session|null>(() => sessions.data?.find(s => s.session_key === sessionKey) ?? null, [sessions.data, sessionKey]);
  const isLive = useMemo(() => isSessionPotentiallyLive(currentSession?.date_end), [currentSession]);

  const drivers = useDrivers(sessionKey, isLive);
  const laps0 = useLaps(sessionKey, driverNums[0], isLive);
  const laps1 = useLaps(sessionKey, driverNums[1], isLive);
  const laps2 = useLaps(sessionKey, driverNums[2], isLive);
  const laps3 = useLaps(sessionKey, driverNums[3], isLive);
  const stints = useStints(sessionKey, isLive);
  const pits = usePits(sessionKey, isLive);
  const weather = useWeather(sessionKey, isLive);
  const raceControl = useRaceControl(sessionKey, isLive);
  const teamRadio = useTeamRadio(sessionKey, isLive);
  const positions = usePositions(sessionKey, isLive);

  useAutoRefresh(isLive, 15000, [laps0.refetch, laps1.refetch, laps2.refetch, laps3.refetch, stints.refetch, pits.refetch, weather.refetch, raceControl.refetch, teamRadio.refetch, positions.refetch]);

  // ── Derived data (extract .data early to avoid dep issues)
  const circuitOpts = useMemo(() => { if (!meetings.data?.length) return []; const seen = new Set<string>(); return meetings.data.filter(m => { if (seen.has(m.circuit_short_name)) return false; seen.add(m.circuit_short_name); return true; }).map(m => ({ v: m.circuit_short_name, l: `${m.circuit_short_name} — ${m.country_name}` })); }, [meetings.data]);
  const sessionOpts = useMemo(() => (sessions.data || []).map(s => ({ v: s.session_key, l: s.session_name })), [sessions.data]);
  const driverList = useMemo(() => drivers.data || [], [drivers.data]);
  const driverMap = useMemo(() => { const m: Record<number,OpenF1Driver> = {}; driverList.forEach(d => { m[d.driver_number] = d; }); return m; }, [driverList]);

  const laps0Data = laps0.data, laps1Data = laps1.data, laps2Data = laps2.data, laps3Data = laps3.data;
  const allLaps = useMemo(() => { const m: Record<number,OpenF1Lap[]> = {}; const srcs = [laps0Data,laps1Data,laps2Data,laps3Data]; driverNums.forEach((num,i) => { if (num && srcs[i]?.length) m[num] = srcs[i]!; }); return m; }, [driverNums, laps0Data, laps1Data, laps2Data, laps3Data]);
  const lapOpts = useMemo(() => { const s = new Set<number>(); Object.values(allLaps).forEach(arr => arr.forEach(l => s.add(l.lap_number))); return Array.from(s).sort((a,b) => a-b); }, [allLaps]);

  const stintsByDriver = useMemo(() => { const m: Record<number,OpenF1Stint[]> = {}; (stints.data||[]).forEach(s => (m[s.driver_number]||=[]).push(s)); return m; }, [stints.data]);
  const getCompoundForLap = useCallback((dn: number, lap: number): string|null => stintsByDriver[dn]?.find(s => lap>=s.lap_start && lap<=s.lap_end)?.compound || null, [stintsByDriver]);
  const getTyreAge = useCallback((dn: number, lap: number): number|null => { const s = stintsByDriver[dn]?.find(st => lap>=st.lap_start && lap<=st.lap_end); return s ? s.tyre_age_at_start + (lap - s.lap_start) : null; }, [stintsByDriver]);

  // ── Fastest laps & sector bests
  const { personalBests, sessionBest } = useMemo(() => {
    const pb: Record<number,{lap:number;time:number}> = {}; let sb: {driver:number;lap:number;time:number}|null = null;
    for (const [ns, laps] of Object.entries(allLaps)) { const n = Number(ns); for (const l of laps) { if (!l.lap_duration||l.lap_duration<=0||l.is_pit_out_lap) continue; if (!pb[n]||l.lap_duration<pb[n].time) pb[n]={lap:l.lap_number,time:l.lap_duration}; if (!sb||l.lap_duration<sb.time) sb={driver:n,lap:l.lap_number,time:l.lap_duration}; } }
    return { personalBests: pb, sessionBest: sb };
  }, [allLaps]);

  const sectorBests = useMemo(() => {
    const best = {s1:Infinity,s2:Infinity,s3:Infinity}; const pbS: Record<number,{s1:number;s2:number;s3:number}> = {};
    for (const [ns, laps] of Object.entries(allLaps)) { const n=Number(ns); pbS[n]={s1:Infinity,s2:Infinity,s3:Infinity}; for (const l of laps) { if (l.is_pit_out_lap) continue; if (l.duration_sector_1&&l.duration_sector_1<best.s1) best.s1=l.duration_sector_1; if (l.duration_sector_2&&l.duration_sector_2<best.s2) best.s2=l.duration_sector_2; if (l.duration_sector_3&&l.duration_sector_3<best.s3) best.s3=l.duration_sector_3; if (l.duration_sector_1&&l.duration_sector_1<pbS[n].s1) pbS[n].s1=l.duration_sector_1; if (l.duration_sector_2&&l.duration_sector_2<pbS[n].s2) pbS[n].s2=l.duration_sector_2; if (l.duration_sector_3&&l.duration_sector_3<pbS[n].s3) pbS[n].s3=l.duration_sector_3; } }
    return { session: best, personal: pbS };
  }, [allLaps]);

  const raceSummary = useMemo(() => {
    if (!sessionBest || !driverList.length) return null;
    const winner = driverMap[sessionBest.driver]; const w = weather.data?.length ? weather.data[weather.data.length-1] : null;
    return { winner: winner?.full_name || '—', fastestLap: fmtLap(sessionBest.time), fastestDriver: winner?.name_acronym || '—', temp: w?.air_temperature, rain: w?.rainfall, sessionName: currentSession?.session_name };
  }, [sessionBest, driverList, driverMap, weather.data, currentSession]);

  // ── Position chart
  const positionData = useMemo(() => {
    if (!positions.data?.length) return [];
    const byLap: Record<number, Record<number,number>> = {};
    for (const num of driverNums) { const posEntries = positions.data.filter(p => p.driver_number === num); if (!posEntries.length) continue; for (const lap of (allLaps[num]||[])) { if (!byLap[lap.lap_number]) byLap[lap.lap_number] = {}; const lt = new Date(lap.date_start).getTime(); let closest = posEntries[0], md = Infinity; for (const pe of posEntries) { const d = Math.abs(new Date(pe.date).getTime()-lt); if (d<md){md=d;closest=pe;} } if (closest) byLap[lap.lap_number][num] = closest.position; } }
    return Object.entries(byLap).map(([lap, pm]) => ({ lap:`L${lap}`, lapNum:Number(lap), ...Object.fromEntries(Object.entries(pm).map(([k,v])=>[`p_${k}`,v])) })).sort((a,b)=>a.lapNum-b.lapNum);
  }, [positions.data, driverNums, allLaps]);

  // ── Tyre degradation
  const tyreDegData = useMemo(() => {
    const data: {stintLap:number;[key:string]:number|string|null}[] = [];
    for (const num of driverNums) { const ds = stintsByDriver[num]; if (!ds?.length) continue; for (const stint of ds) { for (let lap=stint.lap_start;lap<=stint.lap_end;lap++) { const ld=allLaps[num]?.find(l=>l.lap_number===lap); if(!ld?.lap_duration||ld.lap_duration<=0||ld.is_pit_out_lap) continue; const sl=lap-stint.lap_start+1; let entry=data.find(d=>d.stintLap===sl); if(!entry){entry={stintLap:sl};data.push(entry);} entry[`${num}_${stint.stint_number}`]=ld.lap_duration; entry[`c_${num}_${stint.stint_number}`]=stint.compound; } } }
    return data.sort((a,b)=>(a.stintLap as number)-(b.stintLap as number));
  }, [driverNums, stintsByDriver, allLaps]);

  // ── Gap to leader
  const gapToLeaderData = useMemo(() => {
    if (driverNums.length<2) return []; const leader=driverNums[0], leaderLaps=allLaps[leader]||[];
    return lapOpts.map(lap => { const e: Record<string,number|string>={lap:`L${lap}`}; const ll=leaderLaps.find(l=>l.lap_number===lap); if(!ll?.lap_duration) return e; for (const num of driverNums.slice(1)){const dl=allLaps[num]?.find(l=>l.lap_number===lap); if(dl?.lap_duration&&ll.lap_duration) e[`g_${num}`]=dl.lap_duration-ll.lap_duration;} return e; });
  }, [driverNums, allLaps, lapOpts]);

  // ── Sector bar chart
  const sectorBarData = useMemo(() => driverNums.map(num => { const lap=allLaps[num]?.find(l=>l.lap_number===lapNum); const d=driverMap[num]; return{name:d?.name_acronym||`#${num}`,s1:lap?.duration_sector_1??0,s2:lap?.duration_sector_2??0,s3:lap?.duration_sector_3??0,color:`#${d?.team_colour||'888'}`}; }).filter(r=>r.s1>0||r.s2>0||r.s3>0), [driverNums,allLaps,lapNum,driverMap]);

  // ── RC zones for weather overlay
  const rcZones = useMemo(() => {
    const zones: {startLap:number;endLap:number;type:string;color:string}[] = []; const msgs=raceControl.data||[]; let cSC:number|null=null, cVSC:number|null=null;
    for (const msg of msgs) { if(!msg.lap_number) continue; if(msg.message.includes('SAFETY CAR')&&!msg.message.includes('VIRTUAL')&&!msg.message.includes('ENDING')){cSC=msg.lap_number;} if(msg.message.includes('SAFETY CAR')&&msg.message.includes('ENDING')&&cSC){zones.push({startLap:cSC,endLap:msg.lap_number,type:'SC',color:'#F59E0B'});cSC=null;} if(msg.message.includes('VIRTUAL SAFETY CAR')&&!msg.message.includes('ENDING')){cVSC=msg.lap_number;} if(msg.message.includes('VIRTUAL SAFETY CAR')&&msg.message.includes('ENDING')&&cVSC){zones.push({startLap:cVSC,endLap:msg.lap_number,type:'VSC',color:'#F97316'});cVSC=null;} if(msg.flag==='RED'){zones.push({startLap:msg.lap_number,endLap:msg.lap_number+1,type:'RED',color:'#EF4444'});} }
    if(weather.data?.some(w=>w.rainfall)) zones.push({startLap:lapOpts[0]||1,endLap:lapOpts[lapOpts.length-1]||1,type:'Rain',color:'#3B82F6'});
    return zones;
  }, [raceControl.data, weather.data, lapOpts]);

  // ── Auto-select cascading
  useEffect(() => { if (circuitOpts.length>0&&!circuit){if(restoredRef.current.circuit&&circuitOpts.some(c=>c.v===saved.circuit)){setCircuit(saved.circuit!);restoredRef.current.circuit=false;return;}setCircuit(circuitOpts[0].v);restoredRef.current.circuit=false;} }, [circuitOpts, circuit, saved.circuit]);
  useEffect(() => { if (sessionOpts.length>0&&!sessionKey){if(restoredRef.current.session&&sessionOpts.some(s=>s.v===saved.sessionKey)){setSessionKey(saved.sessionKey!);restoredRef.current.session=false;return;}const r=sessionOpts.find(s=>s.l.toLowerCase().includes('race'));setSessionKey(r?.v||sessionOpts[sessionOpts.length-1].v);restoredRef.current.session=false;} }, [sessionOpts, sessionKey, saved.sessionKey]);
  useEffect(() => { if (driverList.length>0&&driverNums.length===0){if(restoredRef.current.drivers&&saved.driverNums?.length){const v=saved.driverNums.filter(n=>driverList.some(d=>d.driver_number===n));if(v.length>0){setDriverNums(v);restoredRef.current.drivers=false;return;}}setDriverNums(driverList.slice(0,2).map(d=>d.driver_number));restoredRef.current.drivers=false;} }, [driverList, driverNums.length, saved.driverNums]);
  useEffect(() => { if (lapOpts.length>0&&!lapOpts.includes(lapNum)) setLapNum(lapOpts.includes(2)?2:lapOpts[0]); }, [lapOpts, lapNum]);

  const handleYearChange = useCallback((y:number) => { restoredRef.current={circuit:false,session:false,drivers:false}; setYear(y);setCircuit(null);setSessionKey(null);setDriverNums([]);setLapNum(1); }, []);
  const handleCircuitChange = useCallback((c:string) => { restoredRef.current={circuit:false,session:false,drivers:false}; setCircuit(c);setSessionKey(null);setDriverNums([]);setLapNum(1); }, []);
  const handleSessionChange = useCallback((sk:string) => { restoredRef.current={circuit:false,session:false,drivers:false}; setSessionKey(+sk);setDriverNums([]);setLapNum(1); }, []);

  // ── Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName; if (tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
      switch(e.key) {
        case 'ArrowLeft': { e.preventDefault(); const i=lapOpts.indexOf(lapNum); if(i>0) setLapNum(lapOpts[i-1]); break; }
        case 'ArrowRight': { e.preventDefault(); const i=lapOpts.indexOf(lapNum); if(i<lapOpts.length-1) setLapNum(lapOpts[i+1]); break; }
        case 'Escape': { e.preventDefault(); if(fullscreenChart) setFullscreenChart(null); else if(tab2) setTab2(null); else if(driverNums.length>1) setDriverNums([driverNums[0]]); break; }
        case '1':case '2':case '3':case '4':case '5':case '6': { const ti=parseInt(e.key)-1; if(ti<TABS.length){e.preventDefault();setTab(TABS[ti].key);} break; }
        case '?': { e.preventDefault(); setShowKbHints(p=>!p); break; }
        case 'b': { e.preventDefault(); toggleBookmark(lapNum); showToast(isBookmarked(lapNum)?`Unbookmarked L${lapNum}`:`Bookmarked L${lapNum}`,'info'); break; }
      }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [lapOpts, lapNum, driverNums, fullscreenChart, tab2, toggleBookmark, isBookmarked, showToast]);

  // ── Telemetry data
  const d1LapObj = useMemo(() => (allLaps[driverNums[0]]||[]).find(l=>l.lap_number===lapNum), [allLaps, driverNums, lapNum]);
  const d1NextObj = useMemo(() => (allLaps[driverNums[0]]||[]).find(l=>l.lap_number===lapNum+1), [allLaps, driverNums, lapNum]);
  const d2LapObj = useMemo(() => (allLaps[driverNums[1]]||[]).find(l=>l.lap_number===lapNum), [allLaps, driverNums, lapNum]);
  const d2NextObj = useMemo(() => (allLaps[driverNums[1]]||[]).find(l=>l.lap_number===lapNum+1), [allLaps, driverNums, lapNum]);

  const telemetry = useLapTelemetry(sessionKey, driverNums[0], d1LapObj?.date_start||null, d1NextObj?.date_start||null);
  const telemetry2 = useLapTelemetry(sessionKey, driverNums[1], d2LapObj?.date_start||null, d2NextObj?.date_start||null);
  const location1 = useLapLocation(sessionKey, driverNums[0], d1LapObj?.date_start||null, d1NextObj?.date_start||null);

  const speedData = useMemo(() => { if (!telemetry.data?.length) return []; const raw=telemetry.data, step=Math.max(1,Math.floor(raw.length/250)); return raw.filter((_,i)=>i%step===0).map((p,i)=>({idx:i,speed:p.speed,throttle:p.throttle,brake:-(p.brake),gear:p.n_gear,drs:p.drs>=10?1:0,rpm:p.rpm})); }, [telemetry.data]);
  const comparisonData = useMemo(() => { if (!telemetry.data?.length||!telemetry2.data?.length) return []; const d1=telemetry.data,d2=telemetry2.data,len=Math.max(d1.length,d2.length),step=Math.max(1,Math.floor(len/250)); const r:{idx:number;speed1:number|null;speed2:number|null}[]=[]; for(let i=0;i<len;i+=step) r.push({idx:r.length,speed1:i<d1.length?d1[i].speed:null,speed2:i<d2.length?d2[i].speed:null}); return r; }, [telemetry.data, telemetry2.data]);
  const deltaData = useMemo(() => { if (!telemetry.data?.length||!telemetry2.data?.length) return []; const d1=telemetry.data,d2=telemetry2.data,len=Math.min(d1.length,d2.length),step=Math.max(1,Math.floor(len/200)); let cum=0; const r:{idx:number;delta:number}[]=[]; for(let i=0;i<len;i+=step){const sd=d1[i].speed-d2[i].speed;cum+=(sd>0?-0.001:0.001)*Math.abs(sd)*step;r.push({idx:r.length,delta:cum});} return r; }, [telemetry.data, telemetry2.data]);
  const locationData = useMemo(() => { if (!location1.data?.length) return []; const step=Math.max(1,Math.floor(location1.data.length/300)); return location1.data.filter((_,i)=>i%step===0).map(p=>({x:p.x,y:p.y})); }, [location1.data]);
  const lapTimeData = useMemo(() => lapOpts.map(lap => { const pt: Record<string,number|string|null>={lap:`L${lap}`}; driverNums.forEach(num => { const l=allLaps[num]?.find(x=>x.lap_number===lap); if(l?.lap_duration&&l.lap_duration>0&&!l.is_pit_out_lap){pt[`t_${num}`]=l.lap_duration; const c=getCompoundForLap(num,lap); if(c) pt[`c_${num}`]=c;} }); return pt; }), [allLaps, driverNums, lapOpts, getCompoundForLap]);

  const sectorRows = useMemo(() => {
    const times=driverNums.map(n=>allLaps[n]?.find(l=>l.lap_number===lapNum)?.lap_duration).filter((t): t is number=>!!t&&t>0);
    const fastest=times.length?Math.min(...times):null;
    return driverNums.map(num => {
      const lap=allLaps[num]?.find(l=>l.lap_number===lapNum); const d=driverMap[num]; const total=lap?.lap_duration??null; const delta=fastest&&total&&total>0?total-fastest:null;
      const sc=(s:'s1'|'s2'|'s3',v:number|null|undefined)=>{if(!v) return 'sector-normal'; if(v<=sectorBests.session[s]+0.001) return 'sector-sb'; if(sectorBests.personal[num]&&v<=sectorBests.personal[num][s]+0.001) return 'sector-pb'; return 'sector-slow';};
      const age=getTyreAge(num,lapNum);
      return{name:d?.name_acronym||`#${num}`,color:`#${d?.team_colour||'888'}`,s1:lap?.duration_sector_1,s2:lap?.duration_sector_2,s3:lap?.duration_sector_3,s1c:sc('s1',lap?.duration_sector_1),s2c:sc('s2',lap?.duration_sector_2),s3c:sc('s3',lap?.duration_sector_3),total,delta,i1:lap?.i1_speed,i2:lap?.i2_speed,st:lap?.st_speed,age,seg1:lap?.segments_sector_1,seg2:lap?.segments_sector_2,seg3:lap?.segments_sector_3};
    });
  }, [allLaps, driverNums, lapNum, driverMap, sectorBests, getTyreAge]);

  const latestWeather = useMemo(() => weather.data?.length ? weather.data[weather.data.length-1] : null, [weather.data]);
  const weatherRadar = useMemo(() => latestWeather ? [{subject:'Air °C',value:Math.min(100,(latestWeather.air_temperature/40)*100)},{subject:'Track °C',value:Math.min(100,(latestWeather.track_temperature/60)*100)},{subject:'Humidity',value:latestWeather.humidity},{subject:'Wind',value:Math.min(100,(latestWeather.wind_speed/15)*100)},{subject:'Rain',value:latestWeather.rainfall?100:0}] : [], [latestWeather]);
  const filteredRC = useMemo(() => { let msgs=raceControl.data||[]; if(rcFlagFilter) msgs=msgs.filter(m=>m.flag?.includes(rcFlagFilter)); if(rcFilter.trim()){const q=rcFilter.toLowerCase(); msgs=msgs.filter(m=>m.message.toLowerCase().includes(q)||(m.flag&&m.flag.toLowerCase().includes(q))||m.category.toLowerCase().includes(q)||(m.driver_number&&driverMap[m.driver_number]?.name_acronym?.toLowerCase().includes(q)));} return msgs; }, [raceControl.data, rcFlagFilter, rcFilter, driverMap]);
  const rcFlagTypes = useMemo(() => { const f=new Set<string>(); (raceControl.data||[]).forEach(m=>{if(m.flag)f.add(m.flag);}); return Array.from(f).sort(); }, [raceControl.data]);

  const toggleDriver = useCallback((num:number) => { setDriverNums(prev => prev.includes(num)?prev.length>1?prev.filter(d=>d!==num):prev:prev.length>=4?[...prev.slice(1),num]:[...prev,num]); }, []);
  const dc = useCallback((num:number) => `#${driverMap[num]?.team_colour||'888'}`, [driverMap]);
  const lapsLoading = laps0.loading||laps1.loading||laps2.loading||laps3.loading;
  const pitLaps = useMemo(() => (pits.data||[]).filter(p=>driverNums.includes(p.driver_number)).map(p=>p.lap_number).filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b), [pits.data, driverNums]);

  const exportSectors = useCallback(() => { downloadCSV(`sectors_lap${lapNum}.csv`,['Driver','S1','S2','S3','Lap','Delta','I1','I2','ST'],sectorRows.map(r=>[r.name,r.s1?.toFixed(3)??'',r.s2?.toFixed(3)??'',r.s3?.toFixed(3)??'',r.total?.toFixed(3)??'',r.delta?fmtDelta(r.delta):'',r.i1??'',r.i2??'',r.st??''])); showToast('Sectors exported'); }, [sectorRows, lapNum, showToast]);
  const exportLapTimes = useCallback(() => { downloadCSV('lap_times.csv',['Lap',...driverNums.map(n=>driverMap[n]?.name_acronym||`#${n}`)],lapTimeData.map(pt=>[pt.lap as string|number,...driverNums.map(n=>pt[`t_${n}`]??'')] as (string|number|null)[])); showToast('Lap times exported'); }, [lapTimeData, driverNums, driverMap, showToast]);
  const exportTelemetry = useCallback(() => { if(!telemetry.data?.length) return; downloadCSV(`telemetry_${driverMap[driverNums[0]]?.name_acronym||'d'}_L${lapNum}.csv`,['timestamp','speed','throttle','brake','gear','rpm','drs'],telemetry.data.map(p=>[p.date,p.speed,p.throttle,p.brake,p.n_gear,p.rpm,p.drs])); showToast('Telemetry exported'); }, [telemetry.data, driverNums, driverMap, lapNum, showToast]);
  const shareUrl = useCallback(() => { navigator.clipboard.writeText(buildShareUrl({year,circuit,sessionKey,driverNums,lapNum,tab})).then(()=>showToast('Link copied!')).catch(()=>showToast('Copy failed','info')); }, [year,circuit,sessionKey,driverNums,lapNum,tab,showToast]);

  const pipelineSteps = useMemo(() => [{label:'Calendar',done:!!meetings.data,loading:meetings.loading},{label:'Sessions',done:!!sessions.data,loading:sessions.loading},{label:'Drivers',done:!!drivers.data,loading:drivers.loading},{label:'Laps',done:Object.keys(allLaps).length>0,loading:lapsLoading}], [meetings.data,meetings.loading,sessions.data,sessions.loading,drivers.data,drivers.loading,allLaps,lapsLoading]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function LapTimeTip({active,payload,label}:{active?:boolean;payload?:any[];label?:string}) { if(!active||!payload?.length) return null; return(<div className="bg-[#0d0d1a]/95 border border-white/10 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-xl text-xs"><div className="text-gray-500 mb-1">{label}</div>{payload.map((p,i:number)=>{const num=parseInt(p.dataKey.replace('t_',''));const lapN=parseInt(String(label).replace('L',''));const compound=getCompoundForLap(num,lapN);return(<div key={i} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{backgroundColor:p.color}}/><span className="text-gray-400">{p.name}:</span><span className="font-mono font-bold" style={{color:p.color}}>{fmtLap(p.value)}</span>{compound&&<span className="text-[9px] px-1 rounded" style={{color:CC[compound.toUpperCase()]||'#888',background:`${CC[compound.toUpperCase()]||'#888'}15`}}>{compound.charAt(0)}</span>}</div>);})}</div>);}

  // ── Tab renderer (shared between main & split)
  function renderTab(t: Tab) {
    switch(t) {
      case 'telemetry': return <TelemetryTab />;
      case 'tires': return <TiresTab />;
      case 'energy': return <EnergyTab />;
      case 'radio': return <RadioTab />;
      case 'incidents': return <IncidentsTab />;
      case 'weather': return <WeatherTab />;
    }
  }

  // ── Inline tab components (they close over dashboard state)
  function TelemetryTab() { return <>
    {raceSummary && <div className="bg-gradient-to-r from-[#12121f] to-[#1a1a2e] border border-white/[0.04] rounded-xl p-4 fade-in flex flex-wrap items-center gap-6"><div className="flex items-center gap-2"><Trophy size={16} className="text-amber-400"/><div><div className="text-[9px] uppercase tracking-widest text-gray-600">{raceSummary.sessionName}</div><div className="text-sm font-bold text-white">{raceSummary.winner}</div></div></div><div><div className="text-[9px] uppercase tracking-widest text-gray-600">Fastest Lap</div><div className="text-sm font-mono font-bold text-purple-400">{raceSummary.fastestLap}</div></div>{raceSummary.temp&&<div><div className="text-[9px] uppercase tracking-widest text-gray-600">Track</div><div className="text-sm font-mono text-gray-300">{raceSummary.temp.toFixed(0)}°C {raceSummary.rain?'🌧':'☀'}</div></div>}</div>}

    <Panel title="Sector Times" icon={<Timer size={14} className="text-purple-500"/>} sub={`Lap ${lapNum}`} actions={sectorRows.some(r=>r.total)?<button onClick={exportSectors} className="p-1 text-gray-600 hover:text-gray-300"><Download size={12}/></button>:undefined}>
      {sectorRows.some(r=>r.total)?(<div className="overflow-x-auto fade-in"><table className="w-full text-sm"><thead><tr className="border-b border-white/[0.06]"><th className="text-left text-[10px] uppercase tracking-widest text-gray-600 py-2">Driver</th><th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">S1</th><th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">S2</th><th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">S3</th><th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">Lap</th><th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">Δ</th><th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">Tyre</th></tr></thead><tbody>{sectorRows.map(r=>(<tr key={r.name} className="border-b border-white/[0.03]"><td className="py-2 font-bold text-xs" style={{color:r.color}}>{r.name}</td><td className={cn('py-2 text-right font-mono text-xs',r.s1c)}>{r.s1?.toFixed(3)??'—'}<SegmentBars segments={r.seg1||[]}/></td><td className={cn('py-2 text-right font-mono text-xs',r.s2c)}>{r.s2?.toFixed(3)??'—'}<SegmentBars segments={r.seg2||[]}/></td><td className={cn('py-2 text-right font-mono text-xs',r.s3c)}>{r.s3?.toFixed(3)??'—'}<SegmentBars segments={r.seg3||[]}/></td><td className="py-2 text-right font-mono text-xs font-bold text-white">{fmtLap(r.total??null)}</td><td className={cn('py-2 text-right font-mono text-xs',r.delta===0||r.delta===null?'text-gray-600':'text-red-400')}>{r.delta!=null&&r.delta!==0?fmtDelta(r.delta):r.delta===0?'P1':'—'}</td><td className="py-2 text-right text-[10px] text-gray-500">{r.age!=null?`${r.age}L`:''}</td></tr>))}</tbody></table></div>):lapsLoading?<TableSkeleton rows={driverNums.length||2}/>:<NoData msg="No sector times."/>}
    </Panel>

    {sectorBarData.length>0&&<Panel title="Sector Comparison" icon={<Activity size={14} className="text-cyan-400"/>} sub={`Lap ${lapNum}`}><div className="fade-in"><ResponsiveContainer width="100%" height={120}><BarChart data={sectorBarData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis type="number" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis type="category" dataKey="name" tick={{fill:'#888',fontSize:10}} stroke="#ffffff06" width={40}/><Tooltip content={<ChartTip/>}/><Bar dataKey="s1" name="S1" stackId="a" fill="#A855F7" fillOpacity={0.7}/><Bar dataKey="s2" name="S2" stackId="a" fill="#3B82F6" fillOpacity={0.7}/><Bar dataKey="s3" name="S3" stackId="a" fill="#22C55E" fillOpacity={0.7}/></BarChart></ResponsiveContainer></div></Panel>}

    <Panel title="Speed Trace" icon={<Gauge size={14} className="text-red-500"/>} sub={`${driverMap[driverNums[0]]?.full_name||'—'} — Lap ${lapNum}`} onExpand={()=>setFullscreenChart('speed')} actions={telemetry.data?.length?<button onClick={exportTelemetry} className="p-1 text-gray-600 hover:text-gray-300"><Download size={12}/></button>:undefined}>
      {telemetry.loading?<ChartSkeleton height={280}/>:speedData.length>0?(<div className="fade-in flex gap-4"><div className="flex-1"><ResponsiveContainer width="100%" height={280}><LineChart data={speedData} onMouseMove={onChartMove} onMouseLeave={onChartLeave}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="idx" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis domain={[0,370]} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="speed" stroke={dc(driverNums[0])} strokeWidth={1.5} dot={false} name="Speed (km/h)"/></LineChart></ResponsiveContainer></div>{locationData.length>0&&<div className="hidden lg:flex flex-col items-center w-[220px] shrink-0"><div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2">Speed Heatmap</div><HeatTrackMap locationData={locationData} telemetryData={speedData} color={dc(driverNums[0])} hoverIdx={chartHoverIdx}/></div>}</div>):<NoData msg="No telemetry. Try a race session."/>}
    </Panel>

    {driverNums.length>=2&&<><Panel title="Speed Comparison" icon={<Activity size={14} className="text-cyan-400"/>} sub={`${driverMap[driverNums[0]]?.name_acronym||'—'} vs ${driverMap[driverNums[1]]?.name_acronym||'—'}`} onExpand={()=>setFullscreenChart('comparison')}>{(telemetry.loading||telemetry2.loading)?<ChartSkeleton height={220}/>:comparisonData.length>0?(<div className="fade-in"><ResponsiveContainer width="100%" height={220}><LineChart data={comparisonData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="idx" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis domain={[0,370]} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="speed1" stroke={dc(driverNums[0])} strokeWidth={1.5} dot={false} connectNulls name={driverMap[driverNums[0]]?.name_acronym||'#1'}/><Line type="monotone" dataKey="speed2" stroke={dc(driverNums[1])} strokeWidth={1.5} dot={false} connectNulls name={driverMap[driverNums[1]]?.name_acronym||'#2'}/></LineChart></ResponsiveContainer></div>):<NoData msg="Select 2+ drivers."/>}</Panel>
    {deltaData.length>0&&<Panel title="Lap Delta" icon={<Timer size={14} className="text-amber-400"/>} sub={`${driverMap[driverNums[0]]?.name_acronym} vs ${driverMap[driverNums[1]]?.name_acronym}`}><div className="fade-in"><ResponsiveContainer width="100%" height={140}><AreaChart data={deltaData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="idx" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis tick={{fill:'#555',fontSize:10}} stroke="#ffffff06" tickFormatter={(v:number)=>`${v>0?'+':''}${v.toFixed(2)}s`}/><ReferenceLine y={0} stroke="#ffffff20" strokeDasharray="4 4"/><Tooltip content={<ChartTip/>}/><Area type="monotone" dataKey="delta" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.08} strokeWidth={1.5} name="Delta (s)"/></AreaChart></ResponsiveContainer></div></Panel>}</>}

    {(telemetry.loading||speedData.length>0)&&<Panel title="Throttle & Brake" icon={<Activity size={14} className="text-emerald-500"/>} onExpand={()=>setFullscreenChart('throttle')}>{telemetry.loading?<ChartSkeleton height={200}/>:<div className="fade-in"><ResponsiveContainer width="100%" height={200}><AreaChart data={speedData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="idx" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis domain={[-110,110]} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06" tickFormatter={(v:number)=>`${Math.abs(v)}%`}/><ReferenceLine y={0} stroke="#ffffff15" strokeDasharray="4 4"/><Tooltip content={<ChartTip/>}/><Area type="monotone" dataKey="throttle" stroke="#22C55E" fill="#22C55E" fillOpacity={0.08} strokeWidth={1.5} name="Throttle %"/><Area type="monotone" dataKey="brake" stroke="#EF4444" fill="#EF4444" fillOpacity={0.08} strokeWidth={1.5} name="Brake"/></AreaChart></ResponsiveContainer></div>}</Panel>}

    <Panel title="Lap Times" icon={<Timer size={14} className="text-purple-500"/>} sub={driverNums.map(n=>driverMap[n]?.name_acronym).filter(Boolean).join(' vs ')} onExpand={()=>setFullscreenChart('laptimes')} actions={<button onClick={exportLapTimes} className="p-1 text-gray-600 hover:text-gray-300"><Download size={12}/></button>}>
      {lapsLoading?<ChartSkeleton/>:lapTimeData.some(pt=>Object.keys(pt).length>1)?(<div className="fade-in"><ResponsiveContainer width="100%" height={280}><LineChart data={lapTimeData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/>{rcZones.map((z,i)=><ReferenceArea key={i} x1={`L${z.startLap}`} x2={`L${z.endLap}`} fill={z.color} fillOpacity={0.06} label={{value:z.type,position:'insideTopLeft',fill:z.color,fontSize:9,opacity:0.5}}/>)}<XAxis dataKey="lap" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06" interval={Math.max(0,Math.floor(lapTimeData.length/15))}/><YAxis domain={['dataMin-0.5','dataMax+0.5']} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<LapTimeTip/>}/><Brush dataKey="lap" height={20} stroke="#ffffff10" fill="#0a0a14" travellerWidth={8}/>{driverNums.map(num=><Line key={num} type="monotone" dataKey={`t_${num}`} stroke={dc(num)} strokeWidth={1.5} dot={{r:1.5}} connectNulls name={driverMap[num]?.name_acronym||`#${num}`}/>)}{sessionBest&&driverNums.includes(sessionBest.driver)&&<ReferenceDot x={`L${sessionBest.lap}`} y={sessionBest.time} yAxisId={0} r={5} fill="#A855F7" stroke="#fff" strokeWidth={1}/>}{driverNums.map(num=>{const pb=personalBests[num];if(!pb||(sessionBest&&sessionBest.driver===num&&sessionBest.lap===pb.lap)) return null;return<ReferenceDot key={`pb-${num}`} x={`L${pb.lap}`} y={pb.time} yAxisId={0} r={4} fill="#22C55E" stroke={dc(num)} strokeWidth={1}/>;})}</LineChart></ResponsiveContainer><div className="flex items-center gap-4 mt-2 text-[10px] text-gray-600"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"/>Session Best</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"/>Personal Best</span>{rcZones.some(z=>z.type==='SC')&&<span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/30"/>SC</span>}{rcZones.some(z=>z.type==='Rain')&&<span className="flex items-center gap-1"><CloudRain size={10} className="text-blue-400"/>Rain</span>}</div></div>):<NoData msg="No lap time data."/>}
    </Panel>

    {positionData.length>0&&<Panel title="Position Chart" icon={<Flag size={14} className="text-amber-400"/>} sub="Race position over laps" onExpand={()=>setFullscreenChart('position')}><div className="fade-in"><ResponsiveContainer width="100%" height={220}><LineChart data={positionData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="lap" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis reversed domain={[1,20]} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<ChartTip/>}/>{driverNums.map(num=><Line key={num} type="stepAfter" dataKey={`p_${num}`} stroke={dc(num)} strokeWidth={2} dot={false} connectNulls name={driverMap[num]?.name_acronym||`#${num}`}/>)}</LineChart></ResponsiveContainer></div></Panel>}

    {gapToLeaderData.length>0&&driverNums.length>=2&&<Panel title="Gap to Leader" icon={<Timer size={14} className="text-red-400"/>} sub={`vs ${driverMap[driverNums[0]]?.name_acronym}`}><div className="fade-in"><ResponsiveContainer width="100%" height={180}><LineChart data={gapToLeaderData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="lap" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis tick={{fill:'#555',fontSize:10}} stroke="#ffffff06" tickFormatter={(v:number)=>`${v>0?'+':''}${v.toFixed(1)}s`}/><ReferenceLine y={0} stroke="#ffffff20" strokeDasharray="4 4"/><Tooltip content={<ChartTip/>}/>{driverNums.slice(1).map(num=><Line key={num} type="monotone" dataKey={`g_${num}`} stroke={dc(num)} strokeWidth={1.5} dot={{r:1}} connectNulls name={driverMap[num]?.name_acronym||`#${num}`}/>)}</LineChart></ResponsiveContainer></div></Panel>}
  </>; }

  function TiresTab() { return <>
    <Panel title="Tyre Strategy" icon={<CircleDot size={14} className="text-red-400"/>}>{stints.loading?<div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="flex items-center gap-4"><div className="skeleton h-5 w-16"/><div className="skeleton h-8 flex-1 rounded-md"/></div>)}</div>:Object.keys(stintsByDriver).length>0?(<div className="space-y-3 fade-in">{(driverNums.length>0?driverNums:Object.keys(stintsByDriver).map(Number).slice(0,6)).map(num=>{const d=driverMap[num];const ds=stintsByDriver[num];if(!d||!ds?.length)return null;const maxLap=Math.max(...ds.map(s=>s.lap_end||0),1);return(<div key={num} className="flex items-center gap-4"><div className="w-16 text-right"><span className="text-xs font-bold" style={{color:`#${d.team_colour}`}}>{d.name_acronym}</span></div><div className="flex-1 h-8 bg-[#0d0d1a] rounded-md overflow-hidden flex">{ds.map((stint,i)=>{const w=Math.max(3,((stint.lap_end-stint.lap_start+1)/maxLap)*100);const c=(stint.compound||'UNKNOWN').toUpperCase();const col=CC[c]||CC.UNKNOWN;return<div key={i} className="h-full flex items-center justify-center text-[10px] font-bold border-r border-white/10 min-w-[24px]" style={{width:`${w}%`,backgroundColor:`${col}18`,color:col}} title={`${c}: L${stint.lap_start}–${stint.lap_end}`}>{c.charAt(0)}<span className="ml-1 opacity-40 hidden sm:inline">{stint.lap_start}-{stint.lap_end}</span></div>;})}</div></div>);})}</div>):<NoData msg="No stint data."/>}</Panel>
    {tyreDegData.length>0&&<Panel title="Tyre Degradation" icon={<Activity size={14} className="text-orange-400"/>} sub="Lap time by stint lap" onExpand={()=>setFullscreenChart('tyredeg')}><div className="fade-in"><ResponsiveContainer width="100%" height={220}><LineChart data={tyreDegData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="stintLap" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06" label={{value:'Stint Lap',position:'insideBottom',fill:'#444',fontSize:9,offset:-2}}/><YAxis domain={['dataMin-0.5','dataMax+0.5']} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<ChartTip/>}/>{Object.keys(tyreDegData[0]||{}).filter(k=>k!=='stintLap'&&!k.startsWith('c_')).map(k=>{const num=Number(k.split('_')[0]);const stintS=k.split('_')[1];const compound=tyreDegData.find(d=>d[`c_${k}`])?.[`c_${k}`] as string|undefined;return<Line key={k} type="monotone" dataKey={k} stroke={dc(num)} strokeWidth={1.5} dot={{r:1.5}} connectNulls name={`${driverMap[num]?.name_acronym||num} S${stintS}${compound?` (${compound.charAt(0)})`:''}`} strokeDasharray={Number(stintS)>1?'4 2':undefined}/>;})}</LineChart></ResponsiveContainer></div></Panel>}
    <Panel title="Pit Stops" icon={<Timer size={14} className="text-amber-500"/>}>{pits.loading?<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-24 rounded-lg"/>)}</div>:pits.data&&pits.data.length>0?(<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 fade-in-stagger">{pits.data.filter(p=>driverNums.length===0||driverNums.includes(p.driver_number)).sort((a,b)=>a.stop_duration-b.stop_duration).map((pit,i)=>{const d=driverMap[pit.driver_number];return(<div key={i} className="bg-[#0d0d1a] rounded-lg p-3"><div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full" style={{backgroundColor:`#${d?.team_colour||'888'}`}}/><span className="text-xs font-bold" style={{color:`#${d?.team_colour||'888'}`}}>{d?.name_acronym||`#${pit.driver_number}`}</span></div><div className="text-xl font-mono font-black text-white">{pit.stop_duration?.toFixed(1)||'—'}<span className="text-sm text-gray-500">s</span></div><div className="text-[10px] text-gray-600">Lap {pit.lap_number}</div></div>);})}</div>):<NoData msg="No pit data."/>}</Panel>
  </>; }

  function EnergyTab() { return <>
    <Panel title="DRS" icon={<Zap size={14} className="text-cyan-400"/>} onExpand={()=>setFullscreenChart('drs')}>{telemetry.loading?<ChartSkeleton height={140}/>:speedData.length>0?<div className="fade-in"><ResponsiveContainer width="100%" height={140}><AreaChart data={speedData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="idx" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis domain={[0,1.2]} ticks={[0,1]} tickFormatter={(v:number)=>v>=1?'OPEN':'CLOSED'} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<ChartTip/>}/><Area type="stepAfter" dataKey="drs" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.15} strokeWidth={2} name="DRS"/></AreaChart></ResponsiveContainer></div>:<NoData msg="No data."/>}</Panel>
    <Panel title="Gear & RPM" icon={<Gauge size={14} className="text-amber-500"/>} onExpand={()=>setFullscreenChart('gear')}>{telemetry.loading?<ChartSkeleton height={180}/>:speedData.length>0?<div className="fade-in"><ResponsiveContainer width="100%" height={180}><LineChart data={speedData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="idx" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis yAxisId="gear" domain={[0,9]} ticks={[1,2,3,4,5,6,7,8]} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis yAxisId="rpm" orientation="right" domain={[0,15000]} tick={{fill:'#333',fontSize:9}} stroke="#ffffff04"/><Tooltip content={<ChartTip/>}/><Line yAxisId="gear" type="stepAfter" dataKey="gear" stroke="#F59E0B" strokeWidth={2} dot={false} name="Gear"/><Line yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#ffffff15" strokeWidth={0.8} dot={false} name="RPM"/></LineChart></ResponsiveContainer></div>:<NoData msg="No data."/>}</Panel>
  </>; }

  function RadioTab() { return <Panel title="Team Radio" icon={<Headphones size={14} className="text-cyan-400"/>}>{teamRadio.loading?<Spinner/>:teamRadio.error?<Err msg={teamRadio.error}/>:(()=>{const msgs=(teamRadio.data||[]).filter(r=>driverNums.length===0||driverNums.includes(r.driver_number));return msgs.length>0?<VirtualList items={msgs} itemHeight={52} maxHeight={500} renderItem={(r,i)=>{const d=driverMap[r.driver_number];return<div key={i} className="flex gap-3 py-2 border-b border-white/[0.03]" style={{height:52}}><div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{backgroundColor:`#${d?.team_colour||'888'}`}}/><div className="flex-1"><div className="flex items-center gap-2 mb-0.5"><span className="text-xs font-bold" style={{color:`#${d?.team_colour||'888'}`}}>{d?.name_acronym||`#${r.driver_number}`}</span><span className="text-[10px] text-gray-700 font-mono">{new Date(r.date).toLocaleTimeString()}</span></div><a href={r.recording_url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 inline-flex items-center gap-1"><Headphones size={10}/>Play ↗</a></div></div>;}}/>:<NoData msg="No team radio."/>;})()}</Panel>; }

  function IncidentsTab() { return <Panel title="Race Control" icon={<Flag size={14} className="text-yellow-500"/>}>{raceControl.loading?<Spinner/>:raceControl.error?<Err msg={raceControl.error}/>:(raceControl.data?.length||0)>0?<><div className="flex flex-wrap gap-2 mb-4"><div className="relative flex-1 min-w-[200px]"><Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600"/><input value={rcFilter} onChange={e=>setRcFilter(e.target.value)} placeholder="Search…" className="w-full bg-[#0d0d1a] border border-white/[0.06] rounded-md pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-red-500/30 placeholder:text-gray-700"/></div><div className="flex gap-1 flex-wrap"><button onClick={()=>setRcFlagFilter(null)} className={cn('px-2 py-1 rounded-md text-[10px] font-bold uppercase',!rcFlagFilter?'bg-white/10 text-white':'bg-white/[0.03] text-gray-600')}>All</button>{rcFlagTypes.map(f=><button key={f} onClick={()=>setRcFlagFilter(rcFlagFilter===f?null:f)} className={cn('px-2 py-1 rounded-md text-[10px] font-bold uppercase',rcFlagFilter===f?'bg-white/10 text-white':'bg-white/[0.03] text-gray-600')}>{f}</button>)}</div></div><VirtualList items={filteredRC} itemHeight={60} maxHeight={600} renderItem={(msg,i)=><div key={i} className="flex gap-4 py-2 border-b border-white/[0.03]" style={{height:60}}><div className="w-16 text-right shrink-0">{msg.lap_number!=null&&<div className="text-[10px] text-gray-500">L{msg.lap_number}</div>}<div className="text-[10px] text-gray-700 font-mono">{new Date(msg.date).toLocaleTimeString()}</div></div><div className="flex-1 overflow-hidden"><div className="flex items-center gap-2 mb-1">{msg.flag&&<span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase',msg.flag.includes('RED')&&'bg-red-500/15 text-red-400',msg.flag.includes('YELLOW')&&'bg-yellow-500/15 text-yellow-400',msg.flag.includes('GREEN')&&'bg-emerald-500/15 text-emerald-400',msg.flag.includes('BLUE')&&'bg-blue-500/15 text-blue-400',msg.flag==='CHEQUERED'&&'bg-white/15 text-white',!msg.flag.match(/RED|YELLOW|GREEN|BLUE|CHEQUERED/)&&'bg-gray-500/15 text-gray-400')}>{msg.flag}</span>}<span className="text-[10px] text-gray-500 uppercase">{msg.category}</span></div><p className="text-xs text-gray-300 truncate">{msg.message}</p></div></div>}/></>:<NoData msg="No race control messages."/>}</Panel>; }

  function WeatherTab() { return <>{weather.loading?<div className="space-y-6"><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-20 rounded-lg"/>)}</div><ChartSkeleton height={280}/></div>:weather.error?<Err msg={weather.error}/>:latestWeather?<><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-in-stagger"><AnimStat label="Air Temperature" value={latestWeather.air_temperature.toFixed(1)} unit="°C" color="#EF4444"/><AnimStat label="Track Temperature" value={latestWeather.track_temperature.toFixed(1)} unit="°C" color="#F97316"/><AnimStat label="Humidity" value={latestWeather.humidity.toFixed(0)} unit="%" color="#3B82F6"/><AnimStat label="Wind Speed" value={latestWeather.wind_speed.toFixed(1)} unit="m/s" color="#06B6D4"/></div><Panel title="Conditions" icon={<Sun size={14} className="text-yellow-400"/>}><div className="fade-in"><ResponsiveContainer width="100%" height={280}><RadarChart data={weatherRadar} outerRadius="70%"><PolarGrid stroke="#ffffff08"/><PolarAngleAxis dataKey="subject" tick={{fill:'#666',fontSize:10}}/><Radar name="Conditions" dataKey="value" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.12} strokeWidth={2}/></RadarChart></ResponsiveContainer></div></Panel></>:<NoData msg="No weather data."/>}</>; }

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a14] text-gray-200 selection:bg-red-600/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden"><div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-red-600/[0.03] blur-[120px]"/><div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.02] blur-[100px]"/></div>
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <header className="pt-8 pb-6 flex items-end justify-between">
          <div><div className="flex items-center gap-3 mb-1"><div className="w-1 h-8 bg-red-600 rounded-full"/><h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white" style={{fontFamily:"'Orbitron',system-ui"}}>F1 TELEMETRY</h1>{isLive&&<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20"><div className="live-dot"/><span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live</span></div>}</div><p className="text-xs tracking-[0.25em] uppercase text-gray-600 ml-[19px]">Powered by OpenF1</p></div>
          <div className="flex items-center gap-2">
            <button onClick={shareUrl} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] uppercase tracking-wider border border-white/[0.06] text-gray-600 hover:text-gray-300 transition-colors" title="Share"><Share2 size={10}/><span className="hidden sm:inline">Share</span></button>
            {tab2?<button onClick={()=>setTab2(null)} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] uppercase tracking-wider border border-red-500/30 text-red-400 bg-red-500/5"><X size={10}/>Split</button>:<button onClick={()=>setTab2('tires')} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] uppercase tracking-wider border border-white/[0.06] text-gray-600 hover:text-gray-300"><Columns size={10}/><span className="hidden sm:inline">Split</span></button>}
            <button onClick={()=>setShowKbHints(p=>!p)} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] uppercase tracking-wider border transition-all',showKbHints?'border-red-500/30 text-red-400 bg-red-500/5':'border-white/[0.06] text-gray-600 hover:text-gray-400')}><Keyboard size={12}/></button>
          </div>
        </header>

        {showKbHints&&<div className="bg-[#12121f]/90 border border-white/[0.06] rounded-xl p-4 mb-6 fade-in backdrop-blur-sm"><div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs"><div className="flex items-center gap-2"><span className="kbd">←</span><span className="kbd">→</span><span className="text-gray-500">Laps</span></div><div className="flex items-center gap-2"><span className="kbd">1</span>–<span className="kbd">6</span><span className="text-gray-500">Tabs</span></div><div className="flex items-center gap-2"><span className="kbd">Esc</span><span className="text-gray-500">Close</span></div><div className="flex items-center gap-2"><span className="kbd">B</span><span className="text-gray-500">Bookmark</span></div><div className="flex items-center gap-2"><span className="kbd">?</span><span className="text-gray-500">Shortcuts</span></div><div className="flex items-center gap-1 text-gray-700"><span className="w-2 h-2 rounded-full bg-emerald-500"/>PB <span className="w-2 h-2 rounded-full bg-purple-500 ml-1"/>SB <span className="w-2 h-2 rounded-full bg-yellow-500 ml-1"/>Slow</div></div></div>}

        {/* Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div><label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Season</label><Select value={year} onChange={v=>handleYearChange(+v)} options={Array.from({length:new Date().getFullYear()-2022},(_,i)=>({v:2023+i,l:String(2023+i)}))} /></div>
          <div><label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Grand Prix</label><Select value={circuit||''} onChange={handleCircuitChange} options={circuitOpts} disabled={!circuitOpts.length} loading={meetings.loading} placeholder={`No data for ${year}`} /></div>
          <div><label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Session</label><Select value={sessionKey||''} onChange={handleSessionChange} options={sessionOpts} disabled={!sessionOpts.length} loading={sessions.loading} /></div>
          <div><label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Lap {lapsLoading&&<Loader2 size={10} className="inline animate-spin ml-1"/>}</label><div className="flex gap-1"><button onClick={()=>{const i=lapOpts.indexOf(lapNum);if(i>0)setLapNum(lapOpts[i-1]);}} disabled={!lapOpts.length||lapOpts.indexOf(lapNum)<=0} className="flex items-center justify-center w-8 bg-[#12121f] border border-white/[0.06] rounded-md text-gray-400 hover:text-white disabled:opacity-20 transition-colors"><ChevronLeft size={14}/></button><div className="flex-1"><Select value={lapNum} onChange={v=>setLapNum(+v)} options={lapOpts.map(l=>({v:l,l:`Lap ${l}${isBookmarked(l)?' ★':''}`}))} disabled={!lapOpts.length} /></div><button onClick={()=>{const i=lapOpts.indexOf(lapNum);if(i<lapOpts.length-1)setLapNum(lapOpts[i+1]);}} disabled={!lapOpts.length||lapOpts.indexOf(lapNum)>=lapOpts.length-1} className="flex items-center justify-center w-8 bg-[#12121f] border border-white/[0.06] rounded-md text-gray-400 hover:text-white disabled:opacity-20 transition-colors"><ChevronRight size={14}/></button></div></div>
        </div>

        {/* Quick jump */}
        {lapOpts.length>0&&<div className="flex flex-wrap items-center gap-2 mb-6 text-[10px]">
          <button onClick={()=>{toggleBookmark(lapNum);showToast(isBookmarked(lapNum)?`Unbookmarked L${lapNum}`:`Bookmarked L${lapNum}`,'info');}} className={cn('star-btn flex items-center gap-1 px-2 py-1 rounded-md border transition-all',isBookmarked(lapNum)?'star-active border-amber-500/30 bg-amber-500/5':'border-white/[0.06] text-gray-600 hover:text-gray-300')}><Star size={10} fill={isBookmarked(lapNum)?'currentColor':'none'}/>{isBookmarked(lapNum)?'Bookmarked':'Bookmark'}</button>
          <button onClick={()=>setLapNum(lapOpts[0])} className="px-2 py-1 rounded-md border border-white/[0.06] text-gray-600 hover:text-gray-300 flex items-center gap-1"><SkipBack size={10}/>First</button>
          <button onClick={()=>setLapNum(lapOpts[lapOpts.length-1])} className="px-2 py-1 rounded-md border border-white/[0.06] text-gray-600 hover:text-gray-300 flex items-center gap-1"><SkipForward size={10}/>Last</button>
          {sessionBest&&lapOpts.includes(sessionBest.lap)&&<button onClick={()=>setLapNum(sessionBest.lap)} className="px-2 py-1 rounded-md border border-purple-500/20 text-purple-400 hover:text-purple-300 flex items-center gap-1"><FastForward size={10}/>Fastest (L{sessionBest.lap})</button>}
          {pitLaps.map(pl=><button key={pl} onClick={()=>setLapNum(pl)} className="px-2 py-1 rounded-md border border-amber-500/15 text-amber-600 hover:text-amber-400">Pit L{pl}</button>)}
          {bookmarks.filter(b=>lapOpts.includes(b.lapNum)&&b.lapNum!==lapNum).map(b=><button key={b.lapNum} onClick={()=>setLapNum(b.lapNum)} className="px-2 py-1 rounded-md border border-amber-500/20 text-amber-500 flex items-center gap-1"><Star size={8} fill="currentColor"/>L{b.lapNum}</button>)}
        </div>}

        {meetings.error&&<Err msg={meetings.error}/>}{sessions.error&&<Err msg={sessions.error}/>}{drivers.error&&<Err msg={drivers.error}/>}
        {pipelineSteps.some(s=>s.loading)&&<LoadProgress steps={pipelineSteps}/>}

        {/* Drivers */}
        {driverList.length>0&&<div className="mb-6 fade-in"><button onClick={()=>setDriversCollapsed(p=>!p)} className="flex items-center gap-2 mb-2"><label className="text-[10px] uppercase tracking-[0.2em] text-gray-600 cursor-pointer">Drivers ({driverNums.length}/4)</label>{driversCollapsed?<ChevronDown size={12} className="text-gray-600"/>:<ChevronUp size={12} className="text-gray-600"/>}</button>{!driversCollapsed&&<div className="flex flex-wrap gap-2 fade-in">{driverList.map(d=><DriverChip key={d.driver_number} d={d} on={driverNums.includes(d.driver_number)} onClick={()=>toggleDriver(d.driver_number)}/>)}</div>}</div>}

        {/* Tabs */}
        <div className="mb-6 border-b border-white/[0.06] hidden sm:block"><div className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">{TABS.map((t,i)=><button key={t.key} onClick={()=>setTab(t.key)} className={cn('flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase whitespace-nowrap border-b-2 transition-all',tab===t.key?'border-red-600 text-white':'border-transparent text-gray-600 hover:text-gray-400')}>{t.icon}{t.label}{showKbHints&&<span className="kbd ml-1">{i+1}</span>}</button>)}</div></div>
        <div className="sm:hidden mobile-bottom-tabs"><div className="flex justify-around">{TABS.map(t=><button key={t.key} onClick={()=>setTab(t.key)} className={cn('flex flex-col items-center gap-0.5 px-2 py-1.5 text-[9px] font-semibold uppercase rounded-md',tab===t.key?'text-red-400 bg-red-500/5':'text-gray-600')}>{t.icon}{t.shortLabel}</button>)}</div></div>

        {/* Content */}
        <div className={cn('pb-16 sm:pb-16 mobile-body-pad', tab2 && 'split-container')}>
          <div className="space-y-6">{renderTab(tab)}</div>
          {tab2&&<div className="space-y-6"><div className="flex items-center gap-2 mb-2">{TABS.map(t=><button key={t.key} onClick={()=>setTab2(t.key)} className={cn('px-2 py-1 rounded text-[10px] font-bold uppercase',tab2===t.key?'bg-white/10 text-white':'text-gray-600 hover:text-gray-400')}>{t.shortLabel}</button>)}</div>{renderTab(tab2)}</div>}
        </div>
      </div>

      {/* Fullscreen */}
      {fullscreenChart&&<FullscreenModal title={fullscreenChart} onClose={()=>setFullscreenChart(null)}><ResponsiveContainer width="100%" height={500}>{fullscreenChart==='speed'?<LineChart data={speedData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="idx" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis domain={[0,370]} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="speed" stroke={dc(driverNums[0])} strokeWidth={2} dot={false}/></LineChart>:fullscreenChart==='comparison'?<LineChart data={comparisonData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="idx" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis domain={[0,370]} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="speed1" stroke={dc(driverNums[0])} strokeWidth={2} dot={false} connectNulls/><Line type="monotone" dataKey="speed2" stroke={dc(driverNums[1])} strokeWidth={2} dot={false} connectNulls/></LineChart>:fullscreenChart==='laptimes'?<LineChart data={lapTimeData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/>{rcZones.map((z,i)=><ReferenceArea key={i} x1={`L${z.startLap}`} x2={`L${z.endLap}`} fill={z.color} fillOpacity={0.06}/>)}<XAxis dataKey="lap" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis domain={['dataMin-0.5','dataMax+0.5']} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<LapTimeTip/>}/><Brush dataKey="lap" height={20} stroke="#ffffff10" fill="#0a0a14"/>{driverNums.map(num=><Line key={num} type="monotone" dataKey={`t_${num}`} stroke={dc(num)} strokeWidth={2} dot={{r:2}} connectNulls name={driverMap[num]?.name_acronym}/>)}</LineChart>:fullscreenChart==='position'?<LineChart data={positionData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="lap" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis reversed domain={[1,20]} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<ChartTip/>}/>{driverNums.map(num=><Line key={num} type="stepAfter" dataKey={`p_${num}`} stroke={dc(num)} strokeWidth={2} dot={false} connectNulls name={driverMap[num]?.name_acronym}/>)}</LineChart>:fullscreenChart==='tyredeg'?<LineChart data={tyreDegData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="stintLap" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis domain={['dataMin-0.5','dataMax+0.5']} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<ChartTip/>}/>{Object.keys(tyreDegData[0]||{}).filter(k=>k!=='stintLap'&&!k.startsWith('c_')).map(k=>{const num=Number(k.split('_')[0]);return<Line key={k} type="monotone" dataKey={k} stroke={dc(num)} strokeWidth={2} dot={{r:1.5}} connectNulls/>;})}</LineChart>:<LineChart data={speedData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06"/><XAxis dataKey="idx" tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><YAxis yAxisId="gear" domain={[0,9]} tick={{fill:'#555',fontSize:10}} stroke="#ffffff06"/><Tooltip content={<ChartTip/>}/><Line yAxisId="gear" type="stepAfter" dataKey="gear" stroke="#F59E0B" strokeWidth={2} dot={false}/></LineChart>}</ResponsiveContainer></FullscreenModal>}

      {/* Toasts */}
      <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 space-y-2">{toasts.map(t=><div key={t.id} className={cn('toast px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xl border',t.exiting&&'toast-exit',t.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400':'bg-blue-500/10 border-blue-500/20 text-blue-400')}>{t.msg}</div>)}</div>
    </div>
  );
}
