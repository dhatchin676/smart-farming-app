// backend/server.js
'use strict';
const express=require('express'),path=require('path'),fs=require('fs'),cors=require('cors'),helmet=require('helmet'),morgan=require('morgan');
require('dotenv').config();
const app=express(), PORT=process.env.PORT||8080;
const TRIES=[path.resolve(__dirname,'..','frontend'),path.resolve(process.cwd(),'frontend'),'/app/frontend',path.resolve(__dirname,'frontend')];
let F=null;
for(const p of TRIES){try{if(fs.existsSync(path.join(p,'intro.html'))){F=p;break;}}catch(e){}}
console.log('Frontend:',F||'NOT FOUND','| dir:',__dirname,'| cwd:',process.cwd());
if(process.env.MONGO_URI){require('mongoose').connect(process.env.MONGO_URI).then(()=>console.log('MongoDB OK')).catch(e=>console.warn('MongoDB:',e.message));}
app.use(helmet({contentSecurityPolicy:false}));
app.use(cors({origin:'*'}));
app.use(express.json({limit:'20mb'}));
app.use(express.urlencoded({extended:true,limit:'20mb'}));
app.use(morgan('tiny'));
if(F)app.use(express.static(F,{index:false}));
function pg(res,p){
  if(!F)return res.status(200).type('html').send('<html><body style="background:#0a0e0a;color:#3dba72;font-family:sans-serif;padding:40px"><h1>SmartFarm AI Running</h1><p>Frontend not found</p><p>cwd='+process.cwd()+'</p><p>dir='+__dirname+'</p><a href="/api/health" style="color:#3dba72">Health</a></body></html>');
  const f=path.join(F,p+'.html');
  if(fs.existsSync(f))return res.sendFile(f);
  const i=path.join(F,'intro.html');
  if(fs.existsSync(i))return res.sendFile(i);
  res.status(404).send('Not found: '+p);
}
app.get('/',(q,r)=>pg(r,'intro'));
['intro','index','login','signup','weather','soil','disease','market','harvest','community','profile'].forEach(p=>app.get('/'+p+'.html',(q,r)=>pg(r,p)));
app.get('/api/health',(q,r)=>r.json({ok:true,frontend:F,cwd:process.cwd(),dir:__dirname,port:PORT,time:new Date().toISOString()}));
function sr(m,f){
  const p=path.join(__dirname,'routes',f+'.js');
  if(!fs.existsSync(p))return;
  try{
    const r=require('./routes/'+f);
    const x=typeof r==='function'?r:(r&&r.router?r.router:null);
    if(x){app.use(m,x);console.log('OK',m);}
    else console.warn('skip',f);
  }catch(e){console.warn('ERR',f,e.message);}
}
sr('/api/weather','weather');sr('/api/soil','soil');sr('/api/disease','disease');
sr('/api/market','market');sr('/api/harvest','harvest');sr('/api/harvest','harvest_ai');
sr('/api/schemes','schemes');sr('/api/chat','chat');sr('/api/auth','auth');
sr('/api/community','community');sr('/api/profile','profile');
app.use((q,r)=>{if(q.path.startsWith('/api/'))return r.status(404).json({ok:false,path:q.path});pg(r,'intro');});
app.use((e,q,r,n)=>r.status(500).json({ok:false,msg:e.message}));
process.on('uncaughtException',e=>console.error('CRASH:',e.message));
process.on('unhandledRejection',e=>console.error('REJ:',String(e)));
app.listen(PORT,'0.0.0.0',()=>console.log('SmartFarm AI port',PORT,'frontend',F||'MISSING'));

