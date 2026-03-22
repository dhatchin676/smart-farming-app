const express=require('express'),cors=require('cors'),helmet=require('helmet'),morgan=require('morgan'),path=require('path'),fs=require('fs');
require('dotenv').config();
const app=express(),PORT=process.env.PORT||5000;
const tries=[path.resolve(__dirname,'..','frontend'),path.resolve(process.cwd(),'frontend'),'/app/frontend',path.resolve(__dirname,'frontend')];
let FRONTEND=null;
for(const p of tries){try{if(fs.existsSync(path.join(p,'intro.html'))){FRONTEND=p;break;}}catch(e){}}
console.log('Frontend:',FRONTEND,'| cwd:',process.cwd(),'| dir:',__dirname);
if(process.env.MONGO_URI){const m=require('mongoose');m.connect(process.env.MONGO_URI).then(()=>console.log('MongoDB OK')).catch(e=>console.warn('MongoDB:',e.message));}
app.use(helmet({contentSecurityPolicy:false}));
app.use(cors({origin:'*'}));
app.use(express.json({limit:'20mb'}));
app.use(express.urlencoded({extended:true,limit:'20mb'}));
app.use(morgan('tiny'));
if(FRONTEND)app.use(express.static(FRONTEND,{index:false}));
function page(res,p){
  if(!FRONTEND)return res.status(200).type('html').send('<html><body style="background:#0a0e0a;color:#3dba72;font-family:sans-serif;padding:40px"><h1>SmartFarm AI Running</h1><p>Frontend path not found</p><p>cwd='+process.cwd()+'</p><p>dir='+__dirname+'</p><a href="/api/health" style="color:#3dba72">Health Check</a></body></html>');
  const f=path.join(FRONTEND,p+'.html'),fb=path.join(FRONTEND,'intro.html');
  if(fs.existsSync(f))return res.sendFile(f);
  if(fs.existsSync(fb))return res.sendFile(fb);
  res.status(404).send('Not found: '+p);
}
app.get('/',(q,r)=>page(r,'intro'));
['intro','index','login','signup','weather','soil','disease','market','harvest','community','profile'].forEach(p=>app.get('/'+p+'.html',(q,r)=>page(r,p)));
app.get('/api/health',(q,r)=>r.json({ok:true,frontend:FRONTEND,cwd:process.cwd(),dir:__dirname,port:PORT,time:new Date().toISOString()}));
function safe(mount,file){
  const p=path.join(__dirname,'routes',file+'.js');
  if(!fs.existsSync(p))return;
  try{const r=require('./routes/'+file);const router=typeof r==='function'||(r&&typeof r.handle==='function')?r:r&&r.router?r.router:null;if(router){app.use(mount,router);console.log('OK',mount);}}catch(e){console.warn('ERR',file,e.message);}
}
safe('/api/weather','weather');safe('/api/soil','soil');safe('/api/disease','disease');
safe('/api/market','market');safe('/api/harvest','harvest');safe('/api/harvest','harvest_ai');
safe('/api/schemes','schemes');safe('/api/chat','chat');safe('/api/auth','auth');
safe('/api/community','community');safe('/api/profile','profile');
app.use((q,r)=>{if(q.path.startsWith('/api/'))return r.status(404).json({ok:false});page(r,'intro');});
app.use((e,q,r,n)=>r.status(500).json({ok:false,msg:e.message}));
process.on('uncaughtException',e=>console.error('ERR:',e.message));
process.on('unhandledRejection',e=>console.error('REJ:',e));
app.listen(PORT,'0.0.0.0',()=>console.log('SmartFarm AI port',PORT,'frontend',FRONTEND||'MISSING'));
