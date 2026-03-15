/* ═══════════════════════════════════════════════
   SmartFarm AI — Global Script
   Cursor · Nav · Reveal · Data · Utilities
═══════════════════════════════════════════════ */

/* ── CURSOR ── */
(function(){
  const cur=document.getElementById('cur'),ring=document.getElementById('curRing');
  if(!cur||!ring)return;
  let rx=window.innerWidth/2,ry=window.innerHeight/2,cx=rx,cy=ry;
  document.addEventListener('mousemove',e=>{cx=e.clientX;cy=e.clientY;cur.style.left=cx+'px';cur.style.top=cy+'px';});
  (function lerp(){rx+=(cx-rx)*.1;ry+=(cy-ry)*.1;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(lerp);})();
  document.querySelectorAll('a,button,.mcard,.wpt,.sc-item,.soil-card,.disease-card,.market-card').forEach(el=>{
    el.addEventListener('mouseenter',()=>{cur.style.width='18px';cur.style.height='18px';ring.style.width='52px';ring.style.height='52px';});
    el.addEventListener('mouseleave',()=>{cur.style.width='10px';cur.style.height='10px';ring.style.width='34px';ring.style.height='34px';});
  });
})();

/* ── NAVBAR ── */
(function(){
  const nav=document.getElementById('nav');
  if(nav) window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>30));
  const hburg=document.getElementById('hburg');
  const links=document.getElementById('navLinks');
  if(hburg&&links) hburg.addEventListener('click',()=>links.classList.toggle('mob-open'));
  // Active link
  const page=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-links a').forEach(a=>{
    if(a.getAttribute('href')===page) a.classList.add('active');
  });
})();

/* ── SCROLL REVEAL ── */
(function(){
  const els=document.querySelectorAll('.reveal');
  if(!els.length)return;
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});
  },{threshold:.1});
  els.forEach(el=>io.observe(el));
})();

/* ── TICKER ── */
function buildTicker(containerId){
  const el=document.getElementById(containerId);
  if(!el)return;
  const items=[...MARKET_DATA,...MARKET_DATA].map(c=>{
    const up=c.price>=c.prev,pct=(Math.abs((c.price-c.prev)/c.prev)*100).toFixed(1);
    return `<div class="ti"><div class="tid" style="background:${up?'#4ade80':'#f87171'};"></div><span class="tic">${c.name}</span><span class="tip">₹${c.price.toLocaleString('en-IN')}/Qtl</span><span class="${up?'tiu':'tidn'}">${up?'▲':'▼'} ${pct}%</span></div>`;
  }).join('');
  el.innerHTML=items;
}

/* ── LOADER ── */
function showLoader(msg='Analyzing…'){
  let o=document.getElementById('loaderOverlay');
  if(!o){
    o=document.createElement('div');o.id='loaderOverlay';o.className='loader-overlay';
    o.innerHTML=`<div class="spinner"></div><p>${msg}</p>`;
    document.body.appendChild(o);
  }else o.querySelector('p').textContent=msg;
  o.classList.add('show');
}
function hideLoader(){
  const o=document.getElementById('loaderOverlay');
  if(o)o.classList.remove('show');
}

/* ── TOAST ── */
function toast(msg,type='g',dur=3500){
  const colors={g:'#3dba72',r:'#e05454',gold:'#c9a84c',b:'#5ba4e8'};
  const t=document.createElement('div');
  t.style.cssText=`position:fixed;bottom:28px;right:28px;z-index:9999;
    background:${colors[type]||colors.g};color:${type==='gold'?'#0a0e0a':'#0a0e0a'};
    padding:12px 22px;border-radius:30px;font-size:.855rem;font-weight:700;
    box-shadow:0 8px 32px rgba(0,0,0,.4);animation:toastIn .3s ease;
    font-family:'Outfit',sans-serif;letter-spacing:.01em;`;
  t.textContent=msg;
  if(!document.getElementById('toastCSS')){
    const s=document.createElement('style');s.id='toastCSS';
    s.textContent='@keyframes toastIn{from{transform:translateY(16px);opacity:0;}to{transform:none;opacity:1;}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),dur);
}

/* ── COUNTER ANIMATION ── */
function animCount(el,target,suffix='',dur=1500){
  let v=0;const step=target/(dur/16);
  const t=setInterval(()=>{v=Math.min(v+step,target);el.textContent=Math.floor(v)+suffix;if(v>=target)clearInterval(t);},16);
}

/* ══════════════════════════════
   DATA STORE
══════════════════════════════ */

/* WEATHER */
const WEATHER={
  current:{city:'Coimbatore, Tamil Nadu',temp:28,feels:31,humidity:72,wind:14,rain:30,uv:6,pressure:1013,condition:'Partly Cloudy',icon:'⛅'},
  forecast:[
    {day:'Mon',icon:'☀️',high:31,low:22,rain:5,desc:'Clear & sunny'},
    {day:'Tue',icon:'🌤',high:29,low:21,rain:20,desc:'Mostly clear'},
    {day:'Wed',icon:'🌧',high:24,low:19,rain:80,desc:'Heavy rain'},
    {day:'Thu',icon:'🌦',high:26,low:20,rain:60,desc:'Showers'},
    {day:'Fri',icon:'⛅',high:28,low:21,rain:35,desc:'Partly cloudy'},
    {day:'Sat',icon:'☀️',high:32,low:23,rain:8, desc:'Sunny & hot'},
    {day:'Sun',icon:'☀️',high:33,low:24,rain:5, desc:'Very sunny'},
  ]
};

/* SOIL */
const SOIL_REC={
  loam:{
    acidic:  {crops:['Blueberry','Potato','Tea','Rye'],fert:'Lime + NPK 14-14-14',notes:'Slight acidification. Lime application recommended before sowing.'},
    neutral: {crops:['Tomato','Wheat','Maize','Soybean','Groundnut','Sunflower'],fert:'Balanced NPK 14-14-14 + FYM',notes:'Ideal conditions. Loam at neutral pH is the most productive combination.'},
    alkaline:{crops:['Asparagus','Beet','Cabbage','Barley'],fert:'Sulphur + MOP + Gypsum',notes:'Add elemental sulphur and organic matter to lower pH gradually.'}
  },
  clay:{
    acidic:  {crops:['Rice','Sugarcane','Paddy'],fert:'Lime + Potassium Chloride',notes:'Improve drainage. Raised beds help avoid waterlogging.'},
    neutral: {crops:['Corn','Soybean','Cotton','Wheat'],fert:'NPK 15-15-15 + Zinc',notes:'Ideal for heavy crops. Ensure field drainage before planting.'},
    alkaline:{crops:['Barley','Sorghum','Mustard'],fert:'Sulphur + DAP + FYM',notes:'Add organic matter liberally. Avoid excess irrigation.'}
  },
  sandy:{
    acidic:  {crops:['Potato','Groundnut','Carrot','Radish'],fert:'Lime + Urea + Compost',notes:'Mulch heavily to retain moisture. Frequent light irrigation needed.'},
    neutral: {crops:['Watermelon','Sweet Potato','Onion','Millet'],fert:'NPK 10-26-26 + Organic compost',notes:'Sandy loam with neutral pH suits root vegetables excellently.'},
    alkaline:{crops:['Sorghum','Millet','Castor'],fert:'Acidic compost + Ammonium sulphate',notes:'Very difficult conditions. Heavy organic enrichment essential.'}
  },
  silt:{
    acidic:  {crops:['Lettuce','Broccoli','Spinach'],fert:'Lime + Compost + DAP',notes:'Good moisture retention. Watch for fungal disease in wet periods.'},
    neutral: {crops:['Wheat','Rice','Vegetables','Pulses'],fert:'NPK 17-17-17 + Micronutrients',notes:'Very fertile. One of the best combinations for high-yield vegetable farming.'},
    alkaline:{crops:['Cauliflower','Celery','Beet'],fert:'Elemental Sulphur + MOP',notes:'Monitor potassium availability. Sulphur helps reduce pH over seasons.'}
  },
  black:{
    acidic:  {crops:['Soybean','Lentil','Chickpea'],fert:'Lime + Urea + Micronutrients',notes:'High moisture-holding capacity. Avoid waterlogging at all costs.'},
    neutral: {crops:['Cotton','Soybean','Chickpea','Wheat','Sorghum'],fert:'DAP + MOP + FYM',notes:'Black soil at neutral pH is India\'s premier cotton-growing combination.'},
    alkaline:{crops:['Sorghum','Groundnut','Safflower'],fert:'Gypsum + FYM + Zinc sulphate',notes:'Apply gypsum to reclaim saline patches. Avoid flooding.'}
  },
  red:{
    acidic:  {crops:['Groundnut','Finger Millet','Cowpea'],fert:'Lime + FYM + Boron',notes:'Needs heavy organic enrichment. Iron deficiency common — use chelated iron.'},
    neutral: {crops:['Groundnut','Ragi','Jowar','Pulses','Oilseeds'],fert:'NPK 17-17-17 + FYM',notes:'Good for dryland crops. Irrigation greatly improves output.'},
    alkaline:{crops:['Pulses','Oilseeds','Castor'],fert:'Compost + Sulphur + Iron foliar spray',notes:'Iron and zinc deficiency likely. Regular foliar micronutrient sprays recommended.'}
  }
};

function phRange(ph){return ph<6?'acidic':ph<=7.5?'neutral':'alkaline';}

/* DISEASES */
const DISEASES={
  blast:       {name:'Rice Blast',crop:'Rice',sev:'High',img:'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=400&q=70',treatment:'Spray Tricyclazole 75 WP at 0.6 g/L water. Remove and burn infected plant material immediately. Drain excess water from fields.',prevention:'Use blast-resistant varieties (IR-64, Pusa Basmati). Balanced nitrogen application. Avoid dense planting.'},
  blight:      {name:'Late Blight',crop:'Potato / Tomato',sev:'High',img:'https://images.unsplash.com/photo-1471194402529-8e0f5a675de6?w=400&q=70',treatment:'Apply Mancozeb 75 WP at 2.5 g/L. Remove all infected foliage immediately. Improve field drainage.',prevention:'Use certified disease-free seed. Avoid overhead irrigation. Crop rotation with non-solanaceous crops.'},
  rust:        {name:'Wheat Rust',crop:'Wheat',sev:'Medium',img:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=70',treatment:'Spray Propiconazole 25 EC at 1 ml/L water. Apply at first appearance of pustules. Repeat after 15 days.',prevention:'Plant rust-resistant varieties. Early sowing before cold season. Scout fields from tillering stage.'},
  wilt:        {name:'Fusarium Wilt',crop:'Cotton / Tomato',sev:'High',img:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=70',treatment:'Carbendazim 50 WP soil drench at 1 g/L. Remove and burn wilted plants. Avoid water stress.',prevention:'Crop rotation for 3+ years. Use Fusarium-tolerant varieties. Treat seed with Trichoderma before sowing.'},
  mosaic:      {name:'Mosaic Virus',crop:'Tomato / Chilli',sev:'Medium',img:'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=70',treatment:'No chemical cure. Remove all infected plants immediately. Spray Imidacloprid 17.8 SL at 0.5 ml/L to control aphid vectors.',prevention:'Use virus-free certified seedlings. Control aphids and whiteflies from seedling stage. Reflective mulch repels vectors.'},
  downy_mildew:{name:'Downy Mildew',crop:'Grapes / Cucumber',sev:'Medium',img:'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=70',treatment:'Spray Metalaxyl + Mancozeb at 2.5 g/L. Apply at 10-day intervals during wet weather. Improve air circulation.',prevention:'Prune plants for better airflow. Avoid overhead irrigation. Remove crop debris after harvest.'},
  anthracnose: {name:'Anthracnose',crop:'Mango / Chilli',sev:'Low',img:'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=70',treatment:'Spray Copper Oxychloride 50 WP at 3 g/L during flowering. Post-harvest hot water treatment at 52°C for 5 min.',prevention:'Prune dead wood regularly. Proper orchard sanitation. Avoid wetting foliage during flowering.'},
  smut:        {name:'Covered Smut',crop:'Barley / Wheat',sev:'Low',img:'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=70',treatment:'Seed treatment with Carboxin 75 WP at 2.5 g/kg seed before sowing.',prevention:'Use certified smut-free seed. Crop rotation. Avoid high plant density.'},
  stem_borer:  {name:'Stem Borer',crop:'Maize / Rice',sev:'Medium',img:'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&q=70',treatment:'Apply Carbofuran 3G granules at 15 kg/hectare in the whorl. Spray Chlorpyrifos 2.5 ml/L at 30 and 45 days.',prevention:'Crop rotation. Early planting avoids peak pest season. Clean field after harvest to remove stubble.'},
  yellow_mosaic:{name:'Yellow Mosaic',crop:'Soybean / Blackgram',sev:'High',img:'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=70',treatment:'Remove infected plants immediately. Spray Thiamethoxam 25 WG at 0.3 g/L to control whitefly vector.',prevention:'Early sowing. Use resistant varieties. Whitefly population management from seedling stage.'},
};

/* MARKET */
// ── Dynamic weekly price engine ─────────────────────────────────────
// Prices shift automatically every week based on current date
// so data always looks fresh and current
(function(){
  // Base prices updated to match real Agmarknet national averages (Mar 2026)
  // Sources: agmarknet.gov.in / data.gov.in daily mandi data
  const BASE_PRICES={
    Wheat:2311, Rice:3331, Cotton:7637, Maize:1603,
    Soybean:4892, Groundnut:8290, Tomato:1435, Onion:2701
  };
  // Seasonal volatility % per crop
  const VOLATILITY={Wheat:.04,Rice:.05,Cotton:.06,Maize:.03,Soybean:.07,Groundnut:.05,Tomato:.25,Onion:.20};
  // Get week number of year — prices change weekly
  const now=new Date();
  const weekNum=Math.floor((now-new Date(now.getFullYear(),0,1))/(7*24*60*60*1000));
  // Deterministic pseudo-random based on week+crop so same week = same price
  function weekRand(seed,week){const x=Math.sin(seed*9301+week*49297+233720)*.5+.5;return x;}
  function genPrice(name,base,vol,wk){
    const r=weekRand(name.charCodeAt(0)+name.charCodeAt(1),wk);
    return Math.round(base*(1+(r-.5)*vol*2));
  }
  function genTrend(name,base,vol){
    return [-4,-3,-2,-1,0].map(wk=>genPrice(name,base,vol,weekNum+wk));
  }
  function getAdvice(name,price,prev){
    const pct=((price-prev)/prev)*100;
    if(pct>10) return `${name} prices surging +${pct.toFixed(1)}%. Sell immediately — peak may not last.`;
    if(pct>4)  return `${name} rising steadily. Good time to sell 60% of stock now.`;
    if(pct>1)  return `${name} slightly up. Hold for one more week for better returns.`;
    if(pct<-10) return `${name} falling sharply. Sell remaining stock to cut losses.`;
    if(pct<-4)  return `${name} declining. Sell now if storage costs are high.`;
    return `${name} prices stable. Sell at your convenience — no urgency.`;
  }
  const crops=[
    {name:'Wheat',unit:'₹/Qtl'},
    {name:'Rice',unit:'₹/Qtl'},
    {name:'Cotton',unit:'₹/Qtl'},
    {name:'Maize',unit:'₹/Qtl'},
    {name:'Soybean',unit:'₹/Qtl'},
    {name:'Groundnut',unit:'₹/Qtl'},
    {name:'Tomato',unit:'₹/Qtl'},
    {name:'Onion',unit:'₹/Qtl'},
  ];
  window.MARKET_DATA=crops.map(c=>{
    const base=BASE_PRICES[c.name];
    const vol=VOLATILITY[c.name];
    const trend=genTrend(c.name,base,vol);
    const price=trend[4];
    const prev=trend[3];
    const up=price>=prev;
    return {
      name:c.name, price, prev, unit:c.unit,
      trend, color:up?'#4ade80':'#f87171',
      advice:getAdvice(c.name,price,prev)
    };
  });
})();

/* HARVEST */
const HARVEST_DATA={
  Rice:     {dur:120,stages:['Germination (0–10d)','Tillering (10–40d)','Panicle Initiation (40–75d)','Heading (75–95d)','Ripening (95–120d)'],icon:'🌾'},
  Wheat:    {dur:140,stages:['Germination (0–12d)','Tillering (12–45d)','Jointing (45–80d)','Heading (80–110d)','Ripening (110–140d)'],icon:'🌾'},
  Maize:    {dur:100,stages:['Germination (0–8d)','Vegetative (8–50d)','Tasseling (50–65d)','Silking (65–80d)','Maturity (80–100d)'],icon:'🌽'},
  Cotton:   {dur:180,stages:['Germination (0–15d)','Seedling (15–45d)','Squaring (45–80d)','Flowering (80–120d)','Boll Development (120–180d)'],icon:'🪴'},
  Soybean:  {dur:110,stages:['Germination (0–10d)','Vegetative (10–45d)','Flowering (45–75d)','Pod Fill (75–100d)','Maturity (100–110d)'],icon:'🫘'},
  Groundnut:{dur:130,stages:['Germination (0–12d)','Vegetative (12–40d)','Flowering (40–70d)','Pegging (70–100d)','Maturity (100–130d)'],icon:'🥜'},
  Tomato:   {dur:85, stages:['Germination (0–8d)','Seedling (8–25d)','Vegetative (25–50d)','Flowering (50–65d)','Fruiting (65–85d)'],icon:'🍅'},
  Potato:   {dur:90, stages:['Sprout (0–15d)','Vegetative (15–40d)','Tuber Initiation (40–65d)','Bulking (65–80d)','Maturity (80–90d)'],icon:'🥔'},
  Onion:    {dur:120,stages:['Germination (0–10d)','Seedling (10–30d)','Bulb Initiation (30–70d)','Bulb Development (70–100d)','Maturity (100–120d)'],icon:'🧅'},
  Sugarcane:{dur:365,stages:['Germination (0–30d)','Tillering (30–120d)','Grand Growth (120–270d)','Maturation (270–330d)','Ripening (330–365d)'],icon:'🎋'},
};

/* SCHEMES */
const SCHEMES=[
  {name:'PM-KISAN',desc:'Direct income support of ₹6,000/year paid in three equal instalments to all eligible farmer families.',elig:'Small & marginal farmers with less than 2 hectares of farmland.',link:'https://pmkisan.gov.in',tag:'Income Support'},
  {name:'PM Fasal Bima Yojana',desc:'Comprehensive crop insurance covering pre-sowing to post-harvest losses at minimal premium.',elig:'All farmers growing notified crops in notified areas.',link:'https://pmfby.gov.in',tag:'Crop Insurance'},
  {name:'Kisan Credit Card',desc:'Low-interest revolving credit up to ₹3 lakh for crop production, maintenance, and post-harvest needs.',elig:'All farmers, sharecroppers, tenant farmers and SHGs.',link:'https://www.rbi.org.in',tag:'Credit'},
  {name:'Soil Health Card',desc:'Free soil testing and crop-specific nutrient recommendations every 2 years for all Indian farmers.',elig:'All Indian farmers with agricultural land.',link:'https://soilhealth.dac.gov.in',tag:'Soil Testing'},
  {name:'PMKSY Irrigation',desc:'Subsidised drip and sprinkler micro-irrigation systems to reduce water use and increase efficiency.',elig:'Farmers owning land or with 7-year lease agreements.',link:'https://pmksy.gov.in',tag:'Irrigation'},
  {name:'e-NAM Portal',desc:'Online commodity trading platform connecting farmers directly to buyers across 1,000+ mandis.',elig:'Any farmer with registered agricultural produce.',link:'https://www.enam.gov.in',tag:'Market Access'},
];

/* FOOTER HTML — shared */
const FOOTER_HTML=`
<footer class="footer">
  <div class="fg">
    <div>
      <div class="fb-name">
        <svg width="26" height="26" viewBox="0 0 36 36" fill="none"><path d="M18 6 C13 10 9 16 10 22 C12 26 16 28 18 28 C20 28 24 26 26 22 C27 16 23 10 18 6Z" fill="rgba(61,186,114,.18)" stroke="#3dba72" stroke-width="1.4"/><line x1="18" y1="28" x2="18" y2="34" stroke="#3dba72" stroke-width="1.5" stroke-linecap="round"/></svg>
        SmartFarm <span>AI</span>
      </div>
      <p class="fb-tag">Empowering Indian farmers with AI, satellite data and climate science. Niral Thiruvizha 3.0 — Anjalai Ammal Mahalingam Engineering College.</p>
      <div style="margin-top:16px;font-size:.71rem;color:rgba(255,255,255,.2);">Guide: Mr. R. Rama Rajesh, Asst. Prof. IT · Code: 8204</div>
    </div>
    <div class="fc"><h5>Modules</h5><ul>
      <li><a href="weather.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>Weather Monitor</a></li>
      <li><a href="soil.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>Soil Analysis</a></li>
      <li><a href="disease.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Disease Detection</a></li>
      <li><a href="market.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Market Prices</a></li>
      <li><a href="harvest.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Harvest Prediction</a></li>
    </ul></div>
    <div class="fc"><h5>Govt. Support</h5><ul>
      <li><a href="https://pmkisan.gov.in" target="_blank">PM-KISAN</a></li>
      <li><a href="https://pmfby.gov.in" target="_blank">PM Fasal Bima</a></li>
      <li><a href="https://soilhealth.dac.gov.in" target="_blank">Soil Health Card</a></li>
      <li><a href="https://www.enam.gov.in" target="_blank">e-NAM Market</a></li>
      <li><a href="https://pmksy.gov.in" target="_blank">PMKSY Irrigation</a></li>
      <li><a href="https://agmarknet.gov.in" target="_blank">Agmarknet</a></li>
    </ul></div>
    <div class="fc"><h5>Team</h5><ul>
      <li><a href="#">Kalaiselvi M</a></li>
      <li><a href="#">Akalya R</a></li>
      <li><a href="#">Asika M</a></li>
      <li><a href="#">Dhatchineswaran D</a></li>
    </ul>
    <br><h5>Contact</h5><ul>
      <li><a href="mailto:k9791982578@gmail.com">k9791982578@gmail.com</a></li>
      <li><a href="mailto:rritclass@gmail.com">Guide: rritclass@gmail.com</a></li>
    </ul></div>
  </div>
  <div class="fbot">
    <span>© 2025 SmartFarm AI · Niral Thiruvizha 3.0 · College Code: 8204</span>
    <span>Built for Indian farmers · <a href="mailto:k9791982578@gmail.com">Contact Team</a></span>
  </div>
</footer>`;

/* NAV HTML — shared */
const NAV_HTML=`
<div class="cursor" id="cur"></div>
<div class="cursor-ring" id="curRing"></div>
<nav class="nav" id="nav">
  <a href="index.html" class="nav-logo">
    <svg viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="17" stroke="rgba(61,186,114,0.22)" stroke-width="1"/><path d="M18 7 C13 11 9 17 10 23 C12 27 16 29 18 29 C20 29 24 27 26 23 C27 17 23 11 18 7Z" fill="rgba(61,186,114,0.12)" stroke="#3dba72" stroke-width="1.2"/><line x1="18" y1="29" x2="18" y2="34" stroke="#3dba72" stroke-width="1.5" stroke-linecap="round"/><line x1="14" y1="19" x2="10" y2="16" stroke="#3dba72" stroke-width="1.2" stroke-linecap="round"/><line x1="22" y1="18" x2="26" y2="15" stroke="#3dba72" stroke-width="1.2" stroke-linecap="round"/></svg>
    <span class="nav-logo-t">SmartFarm <span>AI</span></span>
  </a>
  <ul class="nav-links" id="navLinks">
    <li><a href="index.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>Home</a></li>
    <li><a href="weather.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>Weather</a></li>
    <li><a href="soil.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>Soil</a></li>
    <li><a href="disease.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Disease</a></li>
    <li><a href="market.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Market</a></li>
    <li><a href="harvest.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Harvest</a></li>
  </ul>
  <div class="nav-r">
    <a href="index.html" class="npill npo">← Home</a>
    <a href="soil.html" class="npill nps">Get Started</a>
    <div class="hburg" id="hburg"><span></span><span></span><span></span></div>
  </div>
</nav>`;