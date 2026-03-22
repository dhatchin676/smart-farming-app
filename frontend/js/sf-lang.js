// js/sf-lang.js
// SmartFarm AI — Shared Language & Auth Helper
(function(){

window.SF_LANGUAGES=[
  {code:'en',name:'English',  native:'English',  flag:'🇬🇧'},
  {code:'ta',name:'Tamil',    native:'தமிழ்',     flag:'🇮🇳'},
  {code:'hi',name:'Hindi',    native:'हिंदी',      flag:'🇮🇳'},
  {code:'te',name:'Telugu',   native:'తెలుగు',    flag:'🇮🇳'},
  {code:'kn',name:'Kannada',  native:'ಕನ್ನಡ',     flag:'🇮🇳'},
  {code:'ml',name:'Malayalam',native:'മലയാളം',   flag:'🇮🇳'},
  {code:'mr',name:'Marathi',  native:'मराठी',     flag:'🇮🇳'},
  {code:'gu',name:'Gujarati', native:'ગુજરાતી',   flag:'🇮🇳'},
  {code:'pa',name:'Punjabi',  native:'ਪੰਜਾਬੀ',    flag:'🇮🇳'},
  {code:'bn',name:'Bengali',  native:'বাংলা',     flag:'🇮🇳'},
];

window.SF_GREETING=function(lang,name){
  var n=name||null;
  var g={
    en:'👋 Hello'+(n?' '+n+' sir':'')+'! I am AcqireAI — your smart farming assistant. Ask about crops, diseases, market prices or any farming question!',
    ta:'👋 வணக்கம்'+(n?' '+n+' ஐயா!':'!')+' நான் AcqireAI — உங்கள் விவசாய நிபுணர். பயிர்கள், நோய்கள், சந்தை விலைகள் பற்றி கேளுங்கள்!',
    hi:'👋 नमस्ते'+(n?' '+n+' जी!':'!')+' मैं AcqireAI हूँ — आपका स्मार्ट खेती सहायक। फसल, रोग, बाज़ार भाव या कोई भी खेती का सवाल पूछें!',
    te:'👋 నమస్కారం'+(n?' '+n+' గారూ!':'!')+' నేను AcqireAI — మీ స్మార్ట్ వ్యవసాయ సహాయకుడిని. పంటలు, వ్యాధులు, మార్కెట్ ధరలు అడగండి!',
    kn:'👋 ನಮಸ್ಕಾರ'+(n?' '+n+' ಸರ್!':'!')+' ನಾನು AcqireAI — ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಸಹಾಯಕ. ಬೆಳೆಗಳು, ರೋಗಗಳು, ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಕೇಳಿ!',
    ml:'👋 നമസ്കാരം'+(n?' '+n+' സർ!':'!')+' ഞാൻ AcqireAI — നിങ്ങളുടെ സ്മാർട്ട് കൃഷി സഹായി. വിളകൾ, രോഗങ്ങൾ, വിപണി വില ചോദിക്കൂ!',
    mr:'👋 नमस्कार'+(n?' '+n+' साहेब!':'!')+' मी AcqireAI — तुमचा स्मार्ट शेती सहाय्यक. पिके, रोग, बाजार भाव विचारा!',
    gu:'👋 નમસ્તે'+(n?' '+n+' ભાઈ!':'!')+' હું AcqireAI — તમારો સ્માર્ટ ખેતી સહાયક. પાક, રોગ, બજાર ભાવ પૂછો!',
    pa:'👋 ਸਤ ਸ੍ਰੀ ਅਕਾਲ'+(n?' '+n+' ਜੀ!':'!')+' ਮੈਂ AcqireAI — ਤੁਹਾਡਾ ਸਮਾਰਟ ਖੇਤੀ ਸਹਾਇਕ ਹਾਂ। ਫ਼ਸਲ, ਬਿਮਾਰੀ, ਮੰਡੀ ਭਾਅ ਪੁੱਛੋ!',
    bn:'👋 নমস্কার'+(n?' '+n+' দাদা!':'!')+' আমি AcqireAI — আপনার স্মার্ট কৃষি সহায়ক। ফসল, রোগ, বাজার দর জিজ্ঞেস করুন!',
  };
  return g[lang]||g['en'];
};

window.SF_SUGGESTIONS={
  en:['Best crops for my soil?','Rice disease treatment','When to sell wheat?','PM-KISAN scheme','Irrigation tips'],
  ta:['என் மண்ணுக்கு சிறந்த பயிர்கள்?','நெல் நோய் சிகிச்சை','கோதுமை எப்போது விற்கலாம்?','PM-KISAN திட்டம்','நீர்ப்பாசன குறிப்புகள்'],
  hi:['मेरी मिट्टी के लिए सबसे अच्छी फसल?','चावल रोग उपचार','गेहूं कब बेचें?','PM-KISAN योजना','सिंचाई के सुझाव'],
  te:['నా మట్టికి మంచి పంటలు?','వరి వ్యాధి చికిత్స','గోధుమ ఎప్పుడు అమ్మాలి?','PM-KISAN పథకం','నీటిపారుదల చిట్కాలు'],
  kn:['ನನ್ನ ಮಣ್ಣಿಗೆ ಉತ್ತಮ ಬೆಳೆ?','ಭತ್ತದ ರೋಗ ಚಿಕಿತ್ಸೆ','ಗೋಧಿ ಯಾವಾಗ ಮಾರಬೇಕು?','PM-KISAN ಯೋಜನೆ','ನೀರಾವರಿ ಸಲಹೆಗಳು'],
  ml:['എന്റെ മണ്ണിന് മികച്ച വിളകൾ?','നെൽ രോഗ ചികിത്സ','ഗോതമ്പ് എപ്പോൾ വിൽക്കണം?','PM-KISAN പദ്ധതി','ജലസേചന നുറുങ്ങുകൾ'],
  mr:['माझ्या मातीसाठी उत्तम पिके?','भात रोग उपचार','गहू कधी विकावा?','PM-KISAN योजना','सिंचन टिप्स'],
  gu:['મારી માટી માટે શ્રેષ્ઠ પાક?','ડાંગર રોગ સારવાર','ઘઉં ક્યારે વેચવા?','PM-KISAN યોજના','સિંચાઈ ટિપ્સ'],
  pa:['ਮੇਰੀ ਮਿੱਟੀ ਲਈ ਵਧੀਆ ਫਸਲ?','ਝੋਨਾ ਰੋਗ ਇਲਾਜ','ਕਣਕ ਕਦੋਂ ਵੇਚਣੀ?','PM-KISAN ਯੋਜਨਾ','ਸਿੰਚਾਈ ਸੁਝਾਅ'],
  bn:['আমার মাটির জন্য ভালো ফসল?','ধানের রোগ চিকিৎসা','গম কখন বিক্রি করবেন?','PM-KISAN প্রকল্প','সেচ টিপস'],
};

window.SF_PLACEHOLDER={
  en:'Ask about crops, diseases, schemes...',
  ta:'பயிர், நோய், திட்டங்கள் பற்றி கேளுங்கள்...',
  hi:'फसल, रोग, योजनाओं के बारे में पूछें...',
  te:'పంటలు, వ్యాధులు, పథకాల గురించి అడగండి...',
  kn:'ಬೆಳೆ, ರೋಗ, ಯೋಜನೆ ಬಗ್ಗೆ ಕೇಳಿ...',
  ml:'വിളകൾ, രോഗങ്ങൾ, പദ്ധതികൾ ചോദിക്കൂ...',
  mr:'पिके, रोग, योजनांबद्दल विचारा...',
  gu:'પાક, રોગ, યોજનાઓ વિશે પૂછો...',
  pa:'ਫਸਲ, ਰੋਗ, ਯੋਜਨਾਵਾਂ ਬਾਰੇ ਪੁੱਛੋ...',
  bn:'ফসল, রোগ, প্রকল্প সম্পর্কে জিজ্ঞেস করুন...',
};

// Get current lang
window.SF_GET_LANG=function(){return localStorage.getItem('sf_ui_lang')||'en';};

// Set language globally
window.SF_SET_LANG=function(code){
  localStorage.setItem('sf_ui_lang',code);
  localStorage.setItem('sf_lang',code); // AcqireAI compat
  if(code==='en'){
    document.cookie='googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain='+location.hostname;
    document.cookie='googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    var s=document.querySelector('.goog-te-combo');
    if(s){s.value='en';s.dispatchEvent(new Event('change'));}
  } else {
    document.cookie='googtrans=/en/'+code+'; path=/; domain='+location.hostname;
    document.cookie='googtrans=/en/'+code+'; path=/';
    var tryGT=function(attempts){
      var s=document.querySelector('.goog-te-combo');
      if(s){s.value=code;s.dispatchEvent(new Event('change'));}
      else if(attempts>0) setTimeout(function(){tryGT(attempts-1);},200);
    };
    tryGT(30);
  }
};

// Auth gate — call at top of protected pages
window.SF_AUTH_GATE=function(){
  if(!localStorage.getItem('sf_token')){
    window.location.replace('intro.html');
    return false;
  }
  return true;
};

})();