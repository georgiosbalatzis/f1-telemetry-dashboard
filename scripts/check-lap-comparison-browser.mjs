import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const directory='analysis/hamilton-singapore-2026';
const raw=name=>JSON.parse(readFileSync(`${directory}/raw/${name}.json`,'utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 await page.routeWebSocket('**',socket=>socket.close());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://api.openf1.org/v1/**',async route=>{
  const url=new URL(route.request().url()),endpoint=url.pathname.split('/').pop();
  let body=[];
  if(endpoint==='sessions')body=raw('sessions');
  if(endpoint==='meetings')body=[{meeting_key:1296,meeting_name:'Singapore Grand Prix',meeting_official_name:'Singapore Grand Prix',circuit_key:61,circuit_short_name:'Singapore',country_name:'Singapore',date_start:'2026-10-09T00:00:00Z',date_end:'2026-10-11T23:59:00Z',year:2026,location:'Marina Bay'}];
  if(endpoint==='drivers')body=[{driver_number:44,broadcast_name:'L HAMILTON',first_name:'Lewis',last_name:'Hamilton',full_name:'Lewis Hamilton',name_acronym:'HAM',team_name:'Ferrari',team_colour:'E8002D',headshot_url:null,session_key:11384,meeting_key:1296}];
  if(endpoint==='laps')body=raw('laps');if(endpoint==='race_control')body=raw('race-control');if(endpoint==='session_result')body=raw('results');
  if(endpoint==='car_data'||endpoint==='location'){
   const start=Date.parse(url.searchParams.get('date>'));const end=Date.parse(url.searchParams.get('date<'));
   body=[...raw(`${endpoint}-lap-21`),...raw(`${endpoint}-lap-24`)].filter(s=>Date.parse(s.date)>=start&&Date.parse(s.date)<=end);
  }
  await route.fulfill({json:body});
 });
 await page.goto('http://127.0.0.1:5173/f1-telemetry-dashboard/?year=2026&circuit=Singapore&session=11384&drivers=44&lap=21&tab=telemetry');
 await page.getByRole('combobox',{name:/^Compare/}).waitFor({timeout:10000}).catch(async error=>{console.log(await page.locator('body').innerText());console.log(errors);throw error;});
 await page.getByRole('combobox',{name:/^Compare/}).selectOption('laps');
 for(const [label,lap]of [['Lap A',21],['Lap B',24]]){
  await page.getByRole('combobox',{name:new RegExp('^'+label)}).locator('option').filter({hasText:`L${lap} ·`}).waitFor({state:'attached'});
  const option=await page.getByRole('combobox',{name:new RegExp('^'+label)}).locator('option').evaluateAll((options,lap)=>options.find(o=>o.textContent.startsWith(`L${lap} ·`))?.value,lap);
  assert.ok(option,`Missing ${label}`);await page.getByRole('combobox',{name:new RegExp('^'+label)}).selectOption(option);
 }
 await page.getByText(/L21: 338 synchronized samples/).waitFor();
 assert.equal(await page.locator('.recharts-line').count(),6);
 await page.getByRole('combobox',{name:/^Traces/}).selectOption('b');
 assert.equal(await page.locator('.recharts-line').count(),3);
 await page.getByRole('combobox',{name:/^Distance window/}).selectOption('T3');
 await page.getByRole('combobox',{name:/^Traces/}).selectOption('both');
 assert.equal(await page.locator('.recharts-line').count(),6);
 await page.getByRole('combobox',{name:/^Publication format/}).selectOption('png');
 await page.getByRole('combobox',{name:/^Figure variant/}).selectOption('narrowDark');
 const downloading=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export publication',exact:true}).first().click();
 const download=await downloading;assert.equal(await download.failure(),null);assert.match(download.suggestedFilename(),/\.png$/);
 mkdirSync(`${directory}/validation`,{recursive:true});
 await page.screenshot({path:`${directory}/validation/dashboard-desktop.png`,fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:`${directory}/validation/dashboard-mobile.png`,fullPage:true});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
 assert.equal(overflow,false,'Mobile horizontal overflow');
 assert.deepEqual(errors,[]);
 console.log('Browser passed: real frozen streams, independent lap selectors, two speed/four pedal traces, actual dark mobile PNG download, desktop/mobile screenshots, no page errors or overflow.');
}finally{await browser.close();}
