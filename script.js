// Theme toggle (default dark)
const saved = localStorage.getItem('theme');
document.documentElement.setAttribute('data-theme', saved ? saved : 'dark');
document.getElementById('themeToggle').addEventListener('click', ()=>{
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur==='light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// Background animation: pink orbs + subtle code rain (dark only)
const bg=document.getElementById('bg'), bx=bg.getContext('2d');
function size(){ bg.width=innerWidth; bg.height=innerHeight; } addEventListener('resize',size); size();
const orbs=Array.from({length:60},()=>({x:Math.random()*bg.width,y:Math.random()*bg.height,r:2+Math.random()*5,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6}));
const chars="01<>[]{}$#@!%^&*".split(""); let drops=Array(Math.floor(bg.width/20)).fill(1);
function drawBG(){
  const theme=document.documentElement.getAttribute('data-theme');
  bx.fillStyle = theme==='dark' ? 'rgba(11,6,16,.35)' : 'rgba(255,255,255,.35)';
  bx.fillRect(0,0,bg.width,bg.height);
  for(const o of orbs){ bx.beginPath(); bx.arc(o.x,o.y,o.r,0,Math.PI*2);
    bx.fillStyle= theme==='dark' ? '#ff66cc' : '#ff2da9'; bx.shadowBlur=14; bx.shadowColor=bx.fillStyle; bx.fill(); bx.shadowBlur=0;
    o.x+=o.vx; o.y+=o.vy; if(o.x<0||o.x>bg.width) o.vx*=-1; if(o.y<0||o.y>bg.height) o.vy*=-1; }
  if(theme==='dark'){ bx.fillStyle='rgba(255,102,204,.8)'; bx.font='14px monospace';
    for(let i=0;i<drops.length;i++){ const t=chars[(Math.random()*chars.length)|0]; bx.fillText(t, i*20, drops[i]*20);
      if(drops[i]*20>bg.height && Math.random()>.975) drops[i]=0; drops[i]++; } }
  requestAnimationFrame(drawBG);
}
drawBG();

// Scroll reveal
(function(){
  const els=document.querySelectorAll('.reveal');
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('show'); io.unobserve(en.target);} });
  }, {threshold:.18});
  els.forEach(el=>io.observe(el));
})();

// Mini-game (same mechanics as before, with best score)
const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
const scoreEl=document.getElementById('score')||document.createElement('div'); const bestEl=document.getElementById('bestScore')||document.createElement('div');
const startBtn=document.getElementById('startBtn'); const pauseBtn=document.getElementById('pauseBtn'); const resetBtn=document.getElementById('resetBtn');
let running=false, paused=false, t=0, score=0, mult=1, lives=1; let best=Number(localStorage.getItem('bestScore')||0); if(bestEl) bestEl.textContent=best;
const player={x:canvas.width/2,y:canvas.height/2,r:12,vx:0,vy:0,speed:3,dash:0}; const keys={}, orbsG=[], blocks=[], particles=[];
function rand(a,b){return Math.random()*(b-a)+a} function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dist(ax,ay,bx,by){const dx=ax-bx,dy=ay-by;return Math.hypot(dx,dy)}
function spawnOrb(){orbsG.push({x:rand(30,canvas.width-30),y:rand(30,canvas.height-30),r:8+rand(0,6),ttl:600})}
function spawnBlock(){const e=Math.floor(rand(0,4));let x,y,vx,vy;const s=2+Math.min(4,t/9000);
  if(e===0){x=-20;y=rand(0,canvas.height);vx=s;vy=0} if(e===1){x=canvas.width+20;y=rand(0,canvas.height);vx=-s;vy=0}
  if(e===2){x=rand(0,canvas.width);y=-20;vx=0;vy=s} if(e===3){x=rand(0,canvas.width);y=canvas.height+20;vx=0;vy=-s}
  blocks.push({x,y,w:14+rand(0,16),h:14+rand(0,18),vx,vy})}
function update(dt){
  t+=dt; if(t%500<16) spawnOrb(); if(t%700<16) spawnBlock();
  let ax=0,ay=0; if(keys['ArrowLeft']||keys['a']) ax-=1; if(keys['ArrowRight']||keys['d']) ax+=1; if(keys['ArrowUp']||keys['w']) ay-=1; if(keys['ArrowDown']||keys['s']) ay+=1;
  const sp=player.speed+(player.dash>0?3:0); player.vx=ax*sp; player.vy=ay*sp;
  player.x=clamp(player.x+player.vx,player.r,canvas.width-player.r); player.y=clamp(player.y+player.vy,player.r,canvas.height-player.r);
  player.dash=Math.max(0,player.dash-dt/16);
  for(let i=orbsG.length-1;i>=0;i--){const o=orbsG[i]; o.ttl-=dt; if(o.ttl<=0){orbsG.splice(i,1);continue;}
    if(dist(player.x,player.y,o.x,o.y)<player.r+o.r){score+=Math.round(10*mult);mult=Math.min(10,mult+0.1);
      for(let j=0;j<6;j++){particles.push({x:o.x,y:o.y,vx:rand(-2,2),vy:rand(-2,2),ttl:400,color:'rgba(255,102,204,.95)'})}
      orbsG.splice(i,1);} }
  for(let i=blocks.length-1;i>=0;i--){const b=blocks[i]; b.x+=b.vx; b.y+=b.vy;
    if(b.x<-40||b.x>canvas.width+40||b.y<-40||b.y>canvas.height+40){blocks.splice(i,1);continue;}
    if(player.x>b.x-b.w/2 && player.x<b.x+b.w/2 && player.y>b.y-b.h/2 && player.y<b.y+b.h/2){
      lives-=1; mult=1; particles.push({x:player.x,y:player.y,vx:rand(-3,3),vy:rand(-3,3),ttl:600,color:'rgba(239,68,68,.9)'});
      if(lives<=0){gameOver();} else {player.x=canvas.width/2;player.y=canvas.height/2;} } }
  score += 0.02*mult*dt/16; if(scoreEl) scoreEl.textContent="Score: "+Math.floor(score)+"  ×"+mult.toFixed(1);
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const grad=ctx.createLinearGradient(0,0,canvas.width,0); grad.addColorStop(0,'rgba(255,102,204,.22)'); grad.addColorStop(1,'rgba(139,92,246,.22)');
  ctx.fillStyle=grad; ctx.fillRect(0,0,canvas.width,canvas.height);
  for(const o of orbsG){const g=ctx.createRadialGradient(o.x,o.y,2,o.x,o.y,o.r+10);
    g.addColorStop(0,'rgba(255,255,255,.95)'); g.addColorStop(1,'rgba(255,102,204,.15)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();}
  for(const b of blocks){ctx.fillStyle='rgba(239,68,68,.9)'; ctx.fillRect(b.x-b.w/2,b.y-b.h/2,b.w,b.h);}
  const pG=ctx.createRadialGradient(player.x,player.y,2,player.x,player.y,player.r+14); pG.addColorStop(0,'#fff'); pG.addColorStop(1,'rgba(139,92,246,.25)');
  ctx.fillStyle=pG; ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,Math.PI*2); ctx.fill();
  for(let i=particles.length-1;i>=0;i--){const pt=particles[i]; pt.ttl-=16; pt.x+=pt.vx; pt.y+=pt.vy;
    ctx.fillStyle=pt.color; ctx.globalAlpha=Math.max(0,pt.ttl/600); ctx.fillRect(pt.x,pt.y,3,3); ctx.globalAlpha=1; if(pt.ttl<=0) particles.splice(i,1);}
}
let last=0; function loop(ts){ if(!running||paused){ last=ts; requestAnimationFrame(loop); return; } const dt=ts-last; last=ts; update(dt); draw(); requestAnimationFrame(loop); }
function reset(){ running=false; paused=false; t=0; score=0; mult=1; lives=1; player.x=canvas.width/2; player.y=canvas.height/2; player.dash=0; orbsG.length=0; blocks.length=0; particles.length=0; if(scoreEl) scoreEl.textContent='Score: 0'; draw(); }
function start(){ if(!running){ running=true; paused=false; requestAnimationFrame(loop); } }
function pause(){ paused=!paused; }
function gameOver(){ running=false; const final=Math.floor(score); let best=Number(localStorage.getItem('bestScore')||0); if(final>best){best=final; localStorage.setItem('bestScore',best);} const bestEl=document.getElementById('bestScore'); if(bestEl) bestEl.textContent=best; alert('Game over! Final score: '+final); }
reset();
document.getElementById('startBtn')?.addEventListener('click', start);
document.getElementById('pauseBtn')?.addEventListener('click', pause);
document.getElementById('resetBtn')?.addEventListener('click', reset);
document.addEventListener('keydown',(e)=>{const k=e.key.toLowerCase(); if(['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown',' '].includes(k)) e.preventDefault();
  if(k===' ') player.dash=200; if(k==='arrowleft'||k==='a') keys['a']=keys['ArrowLeft']=true; if(k==='arrowright'||k==='d') keys['d']=keys['ArrowRight']=true; if(k==='arrowup'||k==='w') keys['w']=keys['ArrowUp']=true; if(k==='arrowdown'||k==='s') keys['s']=keys['ArrowDown']=true;});
document.addEventListener('keyup',(e)=>{const k=e.key.toLowerCase(); if(k==='arrowleft'||k==='a') keys['a']=keys['ArrowLeft']=false; if(k==='arrowright'||k==='d') keys['d']=keys['ArrowRight']=false; if(k==='arrowup'||k==='w') keys['w']=keys['ArrowUp']=false; if(k==='arrowdown'||k==='s') keys['s']=keys['ArrowDown']=false;});


// ===== Cursor-following pink flower =====
(function(){
  const el = document.getElementById('cursor-flower');
  if(!el) return;
  let x = innerWidth/2, y = innerHeight/2;
  let tx = x, ty = y;
  const speed = 0.18; // follow smoothness
  function move(){
    x += (tx - x) * speed;
    y += (ty - y) * speed;
    el.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(move);
  }
  move();

  const update = (clientX, clientY)=>{
    tx = clientX; ty = clientY;
  };
  window.addEventListener('mousemove', (e)=> update(e.clientX, e.clientY), {passive:true});
  window.addEventListener('touchmove', (e)=>{
    const t = e.touches[0]; if(t) update(t.clientX, t.clientY);
  }, {passive:true});

  // Hide on game canvas hover to avoid distraction (optional)
  const game = document.getElementById('game');
  if(game){
    game.addEventListener('mouseenter', ()=> el.style.opacity = .35);
    game.addEventListener('mouseleave', ()=> el.style.opacity = .9);
  }
})();


// ===== Cursor-following PNG flower (smooth) =====
(function(){
  const el = document.getElementById('cursor-flower');
  if(!el) return;
  let x = innerWidth/2, y = innerHeight/2;
  let tx = x, ty = y;
  const speed = 0.22; // follow smoothness
  function move(){
    x += (tx - x) * speed;
    y += (ty - y) * speed;
    el.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(move);
  }
  move();
  const update = (cx, cy)=>{ tx = cx; ty = cy; };
  window.addEventListener('mousemove', (e)=> update(e.clientX, e.clientY), {passive:true});
  window.addEventListener('touchmove', (e)=>{ const t=e.touches[0]; if(t) update(t.clientX, t.clientY); }, {passive:true});
  const game = document.getElementById('game');
  if(game){ game.addEventListener('mouseenter', ()=> el.style.opacity=.35); game.addEventListener('mouseleave', ()=> el.style.opacity=.95); }
})();

// ===== Scroll reveal: replay every time (add on enter, remove on leave) =====
(function(){
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('show');
      } else {
        en.target.classList.remove('show'); // remove so it can animate again
      }
    });
  }, {threshold: 0.15});
  els.forEach(el=> io.observe(el));
})();
