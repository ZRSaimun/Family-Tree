const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('public-cadastral-map.js','utf8');
function extract(name) {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf('\n  function ',start+1);
  return source.slice(start,end < 0 ? undefined : end);
}
const context = vm.createContext({sheets:[],records:[],currentRecord:()=>null});
vm.runInContext(extract('currentSheet')+'\n'+extract('geoFromPixels')+'\n'+extract('sheetRecords'),context);
const a={id:'sheet-a',division:'Chattogram',district:'Noakhali',upazila:'Chatkhil',mouza:'Bhimpur',jl_no:'48',survey_type:'BRS',sheet_no:'1'};
context.sheets=[a,{...a,id:'sheet-b',survey_type:'RS'}];
context.r={...a,id:'record-a'};
assert.equal(vm.runInContext('currentSheet(r).id',context),'sheet-a');
for(const key of ['jl_no','survey_type','sheet_no','mouza','district','upazila']) {
 context.r={...a,[key]:'unresolved'};
 assert.equal(vm.runInContext('currentSheet(r)',context),null,key+' must distinguish sheets');
}
context.r={mouza:'Bhimpur'};
assert.equal(vm.runInContext('currentSheet(r)',context),null,'mouza alone is not evidence');
context.r={...a}; context.sheets=[a,{...a,id:'duplicate'}];
assert.equal(vm.runInContext('currentSheet(r)',context),null,'ambiguous sheets require an explicit link');
context.sheet={...a,georef_status:'verified',geo_corners:{nw:{lat:23,lng:91}}};
assert.equal(vm.runInContext('geoFromPixels(sheet,[[0,0],[1,0],[1,1]],"record-a")',context),null,'corners must never create geographic verification');
console.log('Cadastral identity and geographic safety checks passed');
