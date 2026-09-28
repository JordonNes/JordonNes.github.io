const fs=require('fs');

function webpDimensions(path){
  const b=fs.readFileSync(path);
  if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')throw new Error(path+' is not WEBP');
  const chunk=b.toString('ascii',12,16);
  if(chunk==='VP8X'){
    return {
      width:1+b[24]+(b[25]<<8)+(b[26]<<16),
      height:1+b[27]+(b[28]<<8)+(b[29]<<16)
    };
  }
  if(chunk==='VP8 '){
    for(let i=20;i<Math.min(80,b.length-7);i++){
      if(b[i]===0x9d&&b[i+1]===0x01&&b[i+2]===0x2a){
        return {width:(b[i+3]|(b[i+4]<<8))&0x3fff,height:(b[i+5]|(b[i+6]<<8))&0x3fff};
      }
    }
  }
  if(chunk==='VP8L'){
    const b1=b[21],b2=b[22],b3=b[23],b4=b[24];
    return {width:1+(((b2&0x3f)<<8)|b1),height:1+(((b4&0x0f)<<10)|(b3<<2)|((b2&0xc0)>>6))};
  }
  throw new Error('Unsupported WEBP chunk '+chunk+' in '+path);
}

const assets=[
  ['assets/headers/treasure-troll-original-hq.webp',500000],
  ['assets/headers/i-spy-original-hq.webp',500000]
];
for(const [path,minBytes] of assets){
  const stat=fs.statSync(path);
  if(stat.size<minBytes)throw new Error(path+' unexpectedly compressed: '+stat.size+' bytes');
  const d=webpDimensions(path);
  if(d.width!==2172||d.height!==724)throw new Error(path+' wrong dimensions '+d.width+'x'+d.height);
}

const recap=fs.readFileSync('recaplink.js','utf8');
for(const path of ['assets/headers/treasure-troll-original-hq.webp?v=20260928-hqheader1','assets/headers/i-spy-original-hq.webp?v=20260928-hqheader1']){
  if(!recap.includes(path))throw new Error('Missing HQ header mapping '+path);
}
if(!recap.includes("document.createElement('img')"))throw new Error('Specialty header is not rendered as a native img element');
if(!recap.includes("art.width = 2172")||!recap.includes("art.height = 724"))throw new Error('Intrinsic specialty-header dimensions are not declared');
if(!recap.includes("max-width:2172px!important")||!recap.includes("object-fit:contain!important"))throw new Error('No-upscale/object-fit quality guard is missing');

for(const page of ['Treasure_Troll.html','I_Spy.html']){
  const html=fs.readFileSync(page,'utf8');
  if(!html.includes('ljstyle.css?v=20260928-hqheader1'))throw new Error(page+' CSS cache-bust missing');
  if(!html.includes('recaplink.js?v=20260928-hqheader1'))throw new Error(page+' header JS cache-bust missing');
}
console.log('Specialty header quality tests passed: 2172x724 HQ assets, native image rendering, no upscale, cache bust active.');
