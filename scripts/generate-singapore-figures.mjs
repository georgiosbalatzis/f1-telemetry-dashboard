// Uses the dashboard's real projection, contract and renderer. Run with the local Vite server already running.
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const directory = 'analysis/hamilton-singapore-2026';
const raw = name => JSON.parse(readFileSync(`${directory}/raw/${name}.json`, 'utf8'));
const input = { laps: raw('laps'), events: raw('race-control'), circuit: raw('circuit'), cars: [raw('car_data-lap-21'),raw('car_data-lap-24')], locations: [raw('location-lap-21'),raw('location-lap-24')] };
const browser = await chromium.launch({ headless: true });
try {
 const page = await browser.newPage();
 // Keep the export snapshot stable while Vite notices generated artifacts.
 await page.routeWebSocket('**', socket => socket.close());
 await page.goto(process.env.TELEMETRY_URL || 'http://127.0.0.1:5173/f1-telemetry-dashboard/');
 const processed = await page.evaluate(async input => {
  const m = await import('/f1-telemetry-dashboard/src/telemetry/lapComparison.ts');
  const f = await import('/f1-telemetry-dashboard/src/embeds/lapFigures.ts');
  const events=input.events.filter(e=>e.qualifying_phase===3 && e.category==='SessionStatus');
  const evidence={phase:3,source:'OpenF1 phase-tagged race control, FIA Docs 69/70/74 reviewed; OpenF1 completed flying laps',start:events.find(e=>e.message==='SESSION STARTED').date,end:events.find(e=>e.message==='SESSION FINISHED').date,validLapNumbers:input.laps.filter(l=>m.isFlyingLap(l,input.events)).map(l=>l.lap_number),deletedLapNumbers:[]};
  const selection=m.selectQ3Laps(input.laps,evidence);
  if(selection.discrepancy)throw new Error(selection.discrepancy);
  if(selection.candidates.map(l=>l.lap_number).join(',')!=='21,24')throw new Error('Candidate identities changed; review timing evidence before publishing.');
  const map='https://www.fia.com/system/files/decision-document/2026_singapore_grand_prix_-_competition_notes_-_circuit_map_pit_lane_drawing_and_emergency_exits_map.pdf';
  const ref=m.buildTrackReference(input.locations[0],m.lapIdentity(selection.candidates[0]),4927,map);
  const aligned=selection.candidates.map((l,i)=>m.alignLap(input.cars[i],input.locations[i],m.lapIdentity(l),ref));
  const points=m.resampleLaps(aligned,ref.length);
  const corners=input.circuit.corners.map(c=>{
   const p=m.projectPosition(c.trackPosition.x,c.trackPosition.y,ref);
   if(p.error>10)throw new Error(`Corner ${c.number} is not on the reference trajectory`);
   return {label:`T${c.number}`,distance:p.distance,start:c.number===1?200:c.number===3?450:p.distance,end:c.number===1?450:c.number===3?800:p.distance,source:'https://api.multiviewer.app/api/v1/circuits/61/2026 (positions), FIA Doc 7 (numbering); T1/T3 windows are analyst-defined, not official corner boundaries',uncertaintyMetres:20};
  });
  const speed=f.lapFigureData('speed',aligned,points,ref,corners),pedals=f.lapFigureData('pedals',aligned,points,ref,corners);
  for(const d of [...speed.drivers,...pedals.drivers])d.fullName='Lewis Hamilton';
  const interpolate=(samples,key,value,channel)=>{
   const i=samples.findIndex(s=>s[key]>=value);const a=samples[i-1],b=samples[i];
   if(!a||!b||a.segment!==b.segment||(b.elapsed-a.elapsed)>.6)return null;
   return a[channel]+(b[channel]-a[channel])*(value-a[key])/(b[key]-a[key]);
  };
  const cornerMetrics=corners.filter(c=>['T1','T3'].includes(c.label)).map(c=>({corner:c.label,window:[c.start,c.end],marker:c.distance,uncertaintyMetres:c.uncertaintyMetres,laps:aligned.map(l=>{
   const samples=l.samples.filter(s=>s.distance>=c.start&&s.distance<=c.end);
   const minimum=samples.reduce((best,s)=>s.speed<best.speed?s:best,samples[0]);
   const onsetIndex=samples.findIndex(s=>s.brake===1);
   const onset=samples[onsetIndex],previous=onsetIndex>0?samples[onsetIndex-1]:null;
   const reapplied=samples.find(s=>s.distance>=minimum.distance&&s.throttle>=20);
   const full=samples.find(s=>s.distance>=minimum.distance&&s.throttle>=99);
   const transitions=samples.slice(1).filter((s,i)=>s.brake!==samples[i].brake).map(s=>({distance:s.distance,brake:s.brake}));
   const exit=c.end;
   return {lapNumber:l.lap.lapNumber,minimumRecordedSpeed:minimum.speed,minimumDistance:minimum.distance,brakeOnsetBracket:previous&&onset?[previous.distance,onset.distance]:null,throttleReapplication20Percent:reapplied?.distance??null,fullThrottle99Percent:full?.distance??null,exitMarker:exit,exitSpeed:interpolate(l.samples,'distance',exit,'speed'),brakeTransitions:transitions};
  })}));
  const timing=m.timingValidation(aligned,points);
  const sectorChecks=aligned.map((l,i)=>{const lap=selection.candidates[i];return {lapNumber:lap.lap_number,sectors:[lap.duration_sector_1,lap.duration_sector_2,lap.duration_sector_3],sectorSum:lap.duration_sector_1+lap.duration_sector_2+lap.duration_sector_3,stations:[{expected:1639,reconstructed:interpolate(l.samples,'elapsed',lap.duration_sector_1,'distance')},{expected:3421,reconstructed:interpolate(l.samples,'elapsed',lap.duration_sector_1+lap.duration_sector_2,'distance')}]};});
  const coverage=aligned.map(l=>({lapId:l.lap.id,speedGridCoverage:points.filter(p=>p[m.seriesKey(l.lap.id,'speed')]!=null).length/points.length,rawCarCount:input.cars[aligned.indexOf(l)].length,synchronizedCount:l.samples.length,quality:l.quality}));
  const views=[{name:'A-lap-a-speed',title:'Hamilton · Singapore 2026 Q3 · Lap A (1:31.496)',data:f.selectLapFigure(speed,aligned[0].lap.id)}, {name:'B-lap-b-speed',title:'Hamilton · Singapore 2026 Q3 · Lap B (1:31.648)',data:f.selectLapFigure(speed,aligned[1].lap.id)}, {name:'C-combined-speed',title:'Hamilton · Singapore 2026 Q3 · Speed comparison',data:speed}, {name:'D-throttle-brake',title:'Hamilton · Singapore 2026 Q3 · Throttle / brake state',data:pedals}];
  for(const c of corners.filter(c=>['T1','T3'].includes(c.label)))for(const kind of ['speed','pedals']){
   const data=f.lapFigureData(kind,aligned,points,ref,corners,[c.start,c.end]);data.drivers.forEach(d=>d.fullName='Lewis Hamilton');
   const stats=cornerMetrics.find(s=>s.corner===c.label);
   views.push({name:`E-${c.label}-${kind}`,title:`Hamilton · Q3 · ${c.label} · ${kind==='speed'?'Speed':'Throttle / brake state'}`,data,caption:kind==='speed'?`Recorded minima A/B: ${stats.laps[0].minimumRecordedSpeed}/${stats.laps[1].minimumRecordedSpeed} km/h. Exit at ${c.end} m: ${stats.laps[0].exitSpeed.toFixed(1)}/${stats.laps[1].exitSpeed.toFixed(1)} km/h.`: 'Throttle above zero; brake application below (ON/OFF). Small state changes are sampling-limited.'});
  }
  return {evidence,reference:ref,aligned,points,corners,cornerMetrics,timing,sectorChecks,coverage,views,csv:f.alignedCsv(points),publicationStatus:'Qualified: reconstructed physical distance, approximately ±20 m; gaps preserved. Unsuitable for metre-level onset claims or validated corner time losses.'};
 },input);
 mkdirSync(`${directory}/figures`,{recursive:true});
 const outputFiles=[];
 for(const view of processed.views){
  const rendered=await page.evaluate(async ({view,aligned})=>{
   const {exportFigureImages,figurePng}=await import('/f1-telemetry-dashboard/src/embeds/exportFigure.tsx');
   const {lapFigureBundle}=await import('/f1-telemetry-dashboard/src/embeds/lapFigures.ts');
   const {serializeFigureBundle}=await import('/f1-telemetry-dashboard/src/embeds/contract.ts');
   const images=await exportFigureImages(view.data,undefined,{title:view.title,source:'OpenF1 · FIA length / MultiViewer corner positions',caption:[view.caption,'Reconstructed distance (~±20 m). Missing samples remain gaps.'].filter(Boolean).join(' ')});
   const bundle=lapFigureBundle(view.data,{year:2026,circuit:'Singapore',sessionKey:11384,driverNums:[44],lapNum:21,tab:'telemetry'},view.title,images,aligned,{grandPrix:'Singapore Grand Prix',session:'Qualifying · Q3'});
   const pngs={};
   for(const [key,image]of Object.entries(images)){
    const doc=new DOMParser().parseFromString(image.svg,'image/svg+xml');
    if(doc.querySelector('parsererror')||/var\s*\(|<script|<foreignObject/.test(image.svg))throw new Error('Invalid exported SVG');
    const blob=await figurePng(image,3);const data=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);});
    pngs[key]=data.split(',')[1];
   }
   return {images,pngs,json:serializeFigureBundle(bundle)};
  },{view,aligned:processed.aligned});
  writeFileSync(`${directory}/figures/${view.name}.f1embed.json`,rendered.json);
  for(const [variant,image]of Object.entries(rendered.images)){
   const svg=`${view.name}-${variant}.svg`,png=`${view.name}-${variant}.png`;
   writeFileSync(`${directory}/figures/${svg}`,image.svg);const bytes=Buffer.from(rendered.pngs[variant],'base64');
   if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.readUInt32BE(16)!==image.width*3||bytes.readUInt32BE(20)!==image.height*3)throw new Error('Invalid PNG dimensions/signature');
   writeFileSync(`${directory}/figures/${png}`,bytes);outputFiles.push(svg,png);
  }
  console.log(`${view.name}: four SVG + four 3× PNG + v2 publication bundle`);
 }
 // Corner panels retain a common x-axis, and are also delivered as one synchronized SVG/PNG.
 for(const corner of ['T1','T3'])for(const variant of ['narrowLight','wideLight','narrowDark','wideDark']){
  const bundle=kind=>JSON.parse(readFileSync(`${directory}/figures/E-${corner}-${kind}.f1embed.json`,'utf8'));
  const combined=await page.evaluate(async panels=>{
   const {stackFigureImages,figurePng}=await import('/f1-telemetry-dashboard/src/embeds/exportFigure.tsx');
   const image=stackFigureImages(panels);const blob=await figurePng(image,3);
   const png=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(blob);});
   return {image,png};
  },[bundle('speed').images[variant],bundle('pedals').images[variant]]);
  for(const ext of ['svg','png']){const name=`E-${corner}-detail-${variant}.${ext}`;writeFileSync(`${directory}/figures/${name}`,ext==='svg'?combined.image.svg:Buffer.from(combined.png,'base64'));outputFiles.push(name);}
 }
 writeFileSync(`${directory}/aligned.csv`,processed.csv);
 const {views,csv,...analysis}=processed;
 writeFileSync(`${directory}/processed.json`,JSON.stringify(analysis,null,2));
 const manifest={generatedAt:new Date().toISOString(),sessionKey:11384,sourceRequests:['sessions?year=2026&circuit_short_name=Singapore','laps?session_key=11384&driver_number=44','race_control?session_key=11384','session_result?session_key=11384',...processed.aligned.flatMap(l=>['car_data','location'].map(endpoint=>`${endpoint}?session_key=11384&driver_number=44&date>=${l.lap.start}&date<=${l.lap.end}`))].map(path=>'https://api.openf1.org/v1/'+path),rawFiles:['sessions','laps','race-control','results','circuit','car_data-lap-21','car_data-lap-24','location-lap-21','location-lap-24'].map(name=>({file:`raw/${name}.json`,sha256:createHash('sha256').update(readFileSync(`${directory}/raw/${name}.json`)).digest('hex')})),outputFiles,limitations:[processed.publicationStatus,'FIA final classification verifies Lap A; Lap B duration and individual sectors are OpenF1 timing records, not independently verified against a complete FIA per-lap timing sheet.','OpenF1 date_start is approximate; end is start plus recorded duration.','The cumulative finish delta is unavailable; no corner time gains are claimed.']};
 writeFileSync(`${directory}/manifest.json`,JSON.stringify(manifest,null,2));
 // A local article-ready gallery also makes both device sizes/themes reviewable without network requests.
 const gallery=[...views.filter(v=>!v.name.startsWith('E-')),...['T1','T3'].map(corner=>({name:`E-${corner}-detail`,title:`Hamilton · Q3 · ${corner} · Synchronized detail`,bundleNames:[`E-${corner}-speed`,`E-${corner}-pedals`]}))];
 const figures=gallery.map(v=>`<figure><picture><source media="(max-width: 540px)" srcset="figures/${v.name}-narrowLight.svg"><img src="figures/${v.name}-wideLight.svg" alt="${v.title}" loading="lazy"></picture><figcaption>${v.title} · ${(v.bundleNames??[v.name]).map(name=>`<a href="figures/${name}.f1embed.json">Publication JSON</a>`).join(' / ')} · <a href="figures/${v.name}-wideLight.svg">Light SVG</a> · <a href="figures/${v.name}-wideDark.svg">Dark SVG</a> · <a href="figures/${v.name}-wideLight.png">PNG</a> · <a href="figures/${v.name}-narrowDark.png">Mobile dark PNG</a></figcaption></figure>`).join('\n');
 writeFileSync(`${directory}/index.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hamilton Singapore 2026 Q3</title><style>body{max-width:1000px;margin:auto;padding:24px;background:#f2eee4;color:#20251f;font:16px/1.5 Arial,sans-serif}figure{margin:32px 0}img{width:100%;height:auto}a{color:#1d4ed8}</style><h1>Hamilton · Singapore 2026 Q3</h1><p>Lap A: 1:31.496 · Lap B: 1:31.648 (+0.152 s). Reconstructed distance (~±20 m); missing samples remain gaps.</p><p><a href="report.el.md">Greek report</a> · <a href="aligned.csv">Aligned CSV</a> · <a href="processed.json">Processed data / validation</a> · <a href="manifest.json">Provenance</a></p>${figures}</html>`);
 console.log(JSON.stringify({metrics:processed.cornerMetrics,coverage:processed.coverage.map(x=>({lapId:x.lapId,coverage:x.speedGridCoverage})),sectorChecks:processed.sectorChecks,timing:processed.timing},null,2));
}finally{await browser.close();}
