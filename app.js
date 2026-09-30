const $=s=>document.querySelector(s);
const state={text:"MOY",style:"baiwen",shape:"square",face:"yinni",order:"seal",border:18,inset:14,weight:.72,unlocked:false};
const canvas=$("#seal"),ctx=canvas.getContext("2d");
function lettersOf(raw){return raw.toUpperCase().replace(/[^A-Z0-9&]/g,"").slice(0,4).split("").filter(Boolean)}
function cellsFor(n,order){
  if(n<=1)return[{i:0,x:0,y:0,w:1,h:1}];
  if(n===2)return[{i:0,x:0,y:0,w:1,h:.5},{i:1,x:0,y:.5,w:1,h:.5}];
  if(n===3){
    if(order==="seal")return[{i:0,x:0,y:0,w:1,h:1/3},{i:1,x:0,y:1/3,w:1,h:1/3},{i:2,x:0,y:2/3,w:1,h:1/3}];
    return[{i:0,x:0,y:0,w:1,h:.38},{i:1,x:0,y:.38,w:.5,h:.62},{i:2,x:.5,y:.38,w:.5,h:.62}];
  }
  if(order==="seal")return[{i:0,x:.5,y:0,w:.5,h:.5},{i:1,x:.5,y:.5,w:.5,h:.5},{i:2,x:0,y:0,w:.5,h:.5},{i:3,x:0,y:.5,w:.5,h:.5}];
  return[{i:0,x:0,y:0,w:.5,h:.5},{i:1,x:.5,y:0,w:.5,h:.5},{i:2,x:0,y:.5,w:.5,h:.5},{i:3,x:.5,y:.5,w:.5,h:.5}];
}
function hash(n){const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function roundedRect(c,x,y,w,h,r){c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function pathShape(c,cx,cy,size,shape){
  const s=size/2;c.beginPath();
  if(shape==="round")c.arc(cx,cy,s,0,Math.PI*2);
  else if(shape==="oval")c.ellipse(cx,cy,s*.82,s,0,0,Math.PI*2);
  else roundedRect(c,cx-s,cy-s,size,size,Math.max(6,size*.035));
}
function drawTexture(c,w,h,face){
  const img=c.getImageData(0,0,w,h),d=img.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;if(d[i+3]<8)continue;
    const n=hash(x*.17+y*1.9)*.55+hash(x*.03+y*.11)*.45;
    let k=(n-.5)*(face==="dry"?46:face==="aged"?28:22);
    if(face==="aged")k-=(x+y)%17===0?18:0;
    d[i]=clamp(d[i]+k*.35,0,255);d[i+1]=clamp(d[i+1]+k*.12,0,255);d[i+2]=clamp(d[i+2]+k*.08,0,255);
    if(face==="dry"&&n>.82&&d[i+3]>120)d[i+3]=90+n*80;
  }
  c.putImageData(img,0,0);
}
function drawGlyph(c,ch,x,y,w,h,weight,color){
  const px=Math.min(w,h)*(.62+weight*.22);
  c.save();c.fillStyle=color;c.strokeStyle=color;c.textAlign="center";c.textBaseline="middle";
  c.font=`900 ${Math.floor(px)}px "Noto Serif SC","Times New Roman",serif`;
  c.lineJoin="round";c.lineWidth=Math.max(1.5,px*.045*weight);
  c.strokeText(ch,x+w/2,y+h/2+px*.03);c.fillText(ch,x+w/2,y+h/2+px*.03);c.restore();
}
function render(opts={}){
  const letters=lettersOf(state.text),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const paper=ctx.createLinearGradient(0,0,0,H);paper.addColorStop(0,"#f6edd6");paper.addColorStop(1,"#e7d5ae");
  ctx.fillStyle=paper;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalAlpha=.06;ctx.strokeStyle="#6a542e";
  for(let i=0;i<40;i++){ctx.beginPath();const y=hash(i+2)*H;ctx.moveTo(0,y);ctx.lineTo(W,y+(hash(i+9)-.5)*8);ctx.stroke()}
  ctx.restore();
  const size=Math.min(W,H)*.72,cx=W/2,cy=H/2-8,red=state.face==="aged"?"#9a2a1d":"#c12f22",deep="#7a160f";
  ctx.save();pathShape(ctx,cx,cy,size,state.shape);ctx.clip();
  ctx.fillStyle=state.style==="baiwen"?red:"#f7ecd4";pathShape(ctx,cx,cy,size,state.shape);ctx.fill();
  const inner=size-state.border*2-state.inset,ox=cx-inner/2,oy=cy-inner/2;
  const cells=cellsFor(Math.max(letters.length,1),state.order);
  if(letters.length>1){
    ctx.save();ctx.strokeStyle=state.style==="baiwen"?"rgba(243,228,196,.28)":"rgba(193,47,34,.28)";ctx.lineWidth=2;
    const seen=new Set();
    cells.forEach(cell=>{
      if(cell.x>0&&!seen.has("v"+cell.x)){seen.add("v"+cell.x);ctx.beginPath();ctx.moveTo(ox+inner*cell.x,oy+6);ctx.lineTo(ox+inner*cell.x,oy+inner-6);ctx.stroke()}
      if(cell.y>0&&!seen.has("h"+cell.y)){seen.add("h"+cell.y);ctx.beginPath();ctx.moveTo(ox+6,oy+inner*cell.y);ctx.lineTo(ox+inner-6,oy+inner*cell.y);ctx.stroke()}
    });
    ctx.restore();
  }
  letters.forEach((ch,idx)=>{
    const cell=cells.find(c=>c.i===idx)||cells[0];
    const cw=Math.max(24,inner*cell.w-8),chh=Math.max(24,inner*cell.h-8);
    const dx=ox+inner*cell.x+(inner*cell.w-cw)/2,dy=oy+inner*cell.y+(inner*cell.h-chh)/2;
    drawGlyph(ctx,ch,dx,dy,cw,chh,state.weight,state.style==="baiwen"?"#f3e4c4":red);
  });
  ctx.restore();
  ctx.save();pathShape(ctx,cx,cy,size,state.shape);ctx.strokeStyle=red;ctx.lineWidth=state.border;ctx.stroke();
  ctx.lineWidth=Math.max(2,state.border*.22);ctx.strokeStyle=deep;pathShape(ctx,cx,cy,size-state.border*.85,state.shape);ctx.stroke();
  if(state.style==="zhuwen"){ctx.lineWidth=Math.max(2,state.border*.18);ctx.strokeStyle=red;pathShape(ctx,cx,cy,size-state.border*1.55,state.shape);ctx.stroke()}
  ctx.restore();
  drawTexture(ctx,W,H,state.face);
  if(!state.unlocked&&!opts.clean){ctx.save();ctx.font='16px "Source Serif 4",serif';ctx.fillStyle="rgba(40,24,16,.45)";ctx.textAlign="center";ctx.fillText("moyin.preview",W/2,H-28);ctx.restore()}
}
function sync(){const raw=$("#word").value;state.text=raw;const L=lettersOf(raw);$("#count").textContent=L.length+"/4";$("#live").textContent=L.length?L.join(" · "):"—";render()}
function save(blob,filename){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
function toSVG(letters){
  const fill=state.style==="baiwen"?"#c12f22":"#f7ecd4";
  const ink=state.style==="baiwen"?"#f7ecd4":"#c12f22";
  const chars=letters.split("").map((ch,i)=>`<text x="${50+(i%2)*50}" y="${55+Math.floor(i/2)*45}" text-anchor="middle" font-size="38" font-family="serif" font-weight="700" fill="${ink}">${ch}</text>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect x="8" y="8" width="144" height="144" rx="6" fill="${fill}" stroke="#c12f22" stroke-width="10"/>${chars}</svg>`;
}
function download(kind){
  const letters=lettersOf(state.text).join("")||"SEAL";
  const name=`moyin-${letters.toLowerCase()}-${state.style}`;
  if(kind==="svg"){save(new Blob([toSVG(letters)],{type:"image/svg+xml"}),name+".svg");return}
  if(kind==="transparent"){
    const cut=document.createElement("canvas");cut.width=canvas.width;cut.height=canvas.height;const c=cut.getContext("2d");c.drawImage(canvas,0,0);
    const img=c.getImageData(0,0,cut.width,cut.height);
    for(let i=0;i<img.data.length;i+=4){if(Math.abs(img.data[i]-246)+Math.abs(img.data[i+1]-237)+Math.abs(img.data[i+2]-214)<46&&img.data[i]>200)img.data[i+3]=0}
    c.putImageData(img,0,0);cut.toBlob(b=>save(b,name+"-alpha.png"),"image/png");return;
  }
  canvas.toBlob(b=>save(b,name+".png"),"image/png");
}
function applyQuery(){const t=new URLSearchParams(location.search).get("text")||new URLSearchParams(location.search).get("q");if(t)$("#word").value=t}
function bind(){
  applyQuery();
  $("#word").addEventListener("input",sync);
  document.querySelectorAll("[data-k]").forEach(btn=>btn.addEventListener("click",()=>{state[btn.dataset.k]=btn.dataset.v;document.querySelectorAll(`[data-k="${btn.dataset.k}"]`).forEach(b=>b.classList.toggle("on",b===btn));render()}));
  ["border","inset","weight"].forEach(id=>$(`#${id}`).addEventListener("input",e=>{state[id]=Number(e.target.value);render()}));
  $("#png").addEventListener("click",()=>download("png"));
  $("#alpha").addEventListener("click",()=>download("transparent"));
  $("#svg").addEventListener("click",()=>download("svg"));
  $("#unlock").addEventListener("click",()=>{state.unlocked=true;$("#unlock").textContent="Unlocked on this device";render()});
  document.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{$("#word").value=b.dataset.preset;sync()}));
}
bind();sync();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>render());
