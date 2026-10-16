import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { comparisonFixture } from '../../telemetry/__tests__/fixtures';
import { lapFigureBundle, lapFigureData, selectLapFigure, alignedCsv } from '../lapFigures';
import { parseFigureBundle, serializeFigureBundle, validateFigureBundle } from '../contract';
import { TelemetryPlot } from '../TelemetryPlot';
import { exportFigureImages } from '../exportFigure';
import { figureLegend } from '../plotModel';
afterEach(cleanup);
const placeholder = {svg:'<svg></svg>',width:680,height:380};
function fixture() {
 const f=comparisonFixture();
 const data=lapFigureData('speed',f.laps,f.points,f.ref,[{label:'T1',distance:250,start:200,end:300,source:'Synthetic fixture geometry',uncertaintyMetres:20}]);
 const bundle=lapFigureBundle(data,{year:2026,circuit:'Synthetic',sessionKey:f.a.sessionKey,driverNums:[44],lapNum:21,tab:'telemetry'},'Synthetic same-driver comparison',{narrowLight:placeholder,wideLight:placeholder,narrowDark:placeholder,wideDark:placeholder},f.laps);
 return {...f,data,bundle};
}
it('round-trips v2 same-driver identities, physical alignment, validation and brake semantics',()=>{
 const {bundle,data,laps,points,ref}=fixture();
 expect(parseFigureBundle(serializeFigureBundle(bundle))).toEqual(bundle);
 expect(bundle.schemaVersion).toBe(2); expect(bundle.provenance.validation?.lapStreams).toHaveLength(2);
 expect(data.drivers.map(d=>d.lap?.id)[0]).not.toBe(data.drivers[1].lap?.id);
 expect(figureLegend(data).map(l=>l.label)).toEqual(['Lap A · L21','Lap B · L24']);
 const pedals=lapFigureData('pedals',laps,points,ref);
 expect(pedals.points.every(p=>[0,-100,null].includes(p[`brake_${laps[0].lap.id}`]))).toBe(true);
 expect(alignedCsv(points)).toContain(`speed_${laps[1].lap.id}`);
});
it('rejects misidentified laps, unsourced guides, incompatible v1 distance data and inconsistent validation',()=>{
 for(const change of [
  (b:ReturnType<typeof fixture>['bundle'])=>{ b.schemaVersion=1; },
  (b:ReturnType<typeof fixture>['bundle'])=>{ b.data.drivers[1].lap!.lapNumber=21; },
  (b:ReturnType<typeof fixture>['bundle'])=>{ b.data.drivers[1].lap=b.data.drivers[0].lap; },
  (b:ReturnType<typeof fixture>['bundle'])=>{ b.data.drivers[1].lap!.driverNumber=16; },
  (b:ReturnType<typeof fixture>['bundle'])=>{ b.data.distanceAxis!.method='sample-index' as 'location-projection'; },
  (b:ReturnType<typeof fixture>['bundle'])=>{ b.data.guides[0].progress=333; },
  (b:ReturnType<typeof fixture>['bundle'])=>{ b.provenance.validation!.timing.agrees=true; },
  (b:ReturnType<typeof fixture>['bundle'])=>{ b.data.points[1].distance=b.data.points[0].distance; },
 ]){const {bundle}=fixture();change(bundle);expect(()=>validateFigureBundle(bundle)).toThrow();}
});
it('renders independent #44 traces, preserves gaps, and keeps A/B export scales and dimensions identical',async()=>{
 const {data,a,b}=fixture(); const aa=selectLapFigure(data,a.id),bb=selectLapFigure(data,b.id);
 expect(aa.distanceAxis).toEqual(bb.distanceAxis);
 const {container}=render(<TelemetryPlot data={data} width={680}/>);
 expect(container.querySelectorAll('.recharts-line')).toHaveLength(2);
 expect(container.textContent).toContain('Distance (m)');expect(container.textContent).toContain('T1');
 const [imagesA,imagesB]=await Promise.all([exportFigureImages(aa,undefined,{title:'Lap A',source:'Synthetic fixture'}),exportFigureImages(bb,undefined,{title:'Lap B',source:'Synthetic fixture'})]);
 for(const key of ['narrowLight','wideLight','narrowDark','wideDark'] as const){
  expect(imagesA[key].width).toBe(imagesB[key].width);expect(imagesA[key].height).toBe(imagesB[key].height);
  const doc=new DOMParser().parseFromString(imagesA[key].svg,'image/svg+xml');
  const docB=new DOMParser().parseFromString(imagesB[key].svg,'image/svg+xml');
  for(const axis of ['xAxis','yAxis']) expect([...doc.querySelectorAll(`.recharts-${axis} .recharts-cartesian-axis-tick-value`)].map(n=>n.textContent)).toEqual([...docB.querySelectorAll(`.recharts-${axis} .recharts-cartesian-axis-tick-value`)].map(n=>n.textContent));
  expect(doc.querySelector('parsererror')).toBeNull(); expect(imagesA[key].svg).toContain('Lap A');
  expect(imagesA[key].svg).toContain('Synthetic fixture');expect(imagesA[key].svg).not.toContain('var(');
 }
});
