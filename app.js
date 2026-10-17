/* منطق تطبيق حكاية وعبرة */
const KEY="hikaya-v1";
let S={name:"صديقي الصغير",age:6,stars:0,done:{},quiz:{},fav:[],chDone:{},chDate:"",dayIdx:0,fs:17,sound:true,level:"all",acts:{}};
try{const l=JSON.parse(localStorage.getItem(KEY)||"{}");S={...S,...l};}catch(e){}
function save(){localStorage.setItem(KEY,JSON.stringify(S));}
const $=id=>document.getElementById(id);
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove("show"),2200);}
function esc(s){return String(s).replace(/</g,"&lt;");}

// اليوم
const todayStr=new Date().toDateString();
if(S.chDate!==todayStr){const d=new Date();S.dayIdx=Math.floor(d.getTime()/86400000)%STORIES.length;S.chDate=todayStr;save();}
const storyOfDay=STORIES[S.dayIdx%STORIES.length];
const valOfDay=DAILY_VALUES[new Date().getDate()%DAILY_VALUES.length];

function stars(){return S.stars;}
function addStars(n){S.stars+=n;save();renderTop();}
function renderTop(){$("starsCount").textContent=S.stars;$("helloName").textContent=S.name;document.documentElement.style.setProperty("--fs",S.fs+"px");}
function nav(v){document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));$("v-"+v).classList.add("active");document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.v===v));window.scrollTo({top:0,behavior:"smooth"});if(v==="home")renderHome();if(v==="ach")renderAch();if(v==="parent")renderParent();}

// الرئيسية
function renderHome(){
 $("heroHello").textContent=`مرحبًا ${S.name}! 🌙`;
 $("storyDay").innerHTML=`<div class="emoji">${storyOfDay.art}</div><h3 style="margin:6px 0">${esc(storyOfDay.title)}</h3>
 <span class="badge ${storyOfDay.doc?"b-doc":"b-fic"}">${storyOfDay.doc?"✅ قصة موثقة":"💡 قصة خيالية للتعلم"}</span>
 <span class="badge b-val">💎 ${esc(storyOfDay.value)}</span>
 <p class="meta">${esc(storyOfDay.desc)} • ⏱ ${storyOfDay.mins} دقائق</p>
 <button class="btn btn-primary btn-big" onclick="openStory('${storyOfDay.id}')">📖 اقرأ حكاية اليوم</button>`;
 $("valDay").innerHTML=`<div class="emoji">${valOfDay.e}</div><h3>قيمة اليوم: ${valOfDay.v}</h3><p>${valOfDay.d}</p>`;
 const ch=storyOfDay.challenge;
 const doneToday=S.chDone[storyOfDay.id+"_"+todayStr];
 $("chDay").innerHTML=`<div class="emoji">🎯</div><h3>تحدي اليوم: ${esc(ch.value)}</h3><p>${esc(ch.task)}</p>
 <button class="btn ${doneToday?"btn-soft":"btn-gold"} btn-big" onclick="doChallenge('${storyOfDay.id}')">${doneToday?"✅ تم الإنجاز! أحسنت":"🌟 أنجزت التحدي"}</button>`;
 const total=STORIES.length, dn=Object.keys(S.done).length;
 const pct=total?Math.round(dn/total*100):0;
 $("progFill").style.width=pct+"%";$("progTxt").textContent=`أكملت ${dn} من ${total} حكايات • ⭐ ${S.stars} نجمة`;
}

// المكتبة
let F={q:"",cat:"all",age:"all",onlyFav:false};
function renderLib(){
 const g=$("libGrid");g.innerHTML="";
 let list=STORIES.filter(s=>{
  if(S.level!=="all"){if(S.level==="small"&&s.age!=="4-6")return false;if(S.level==="big"&&s.age!=="6-9"&&s.age!=="4-9")return false;}
  if(F.cat!=="all"&&s.cat!==F.cat)return false;
  if(F.age!=="all"&&s.age!==F.age&&s.age!=="4-9")return false;
  if(F.onlyFav&&!S.fav.includes(s.id))return false;
  if(F.q&&!(s.title.includes(F.q)||s.value.includes(F.q)))return false;
  return true;});
 if(!list.length){g.innerHTML=`<div class="card">لا توجد قصص مطابقة 🔍 جرّب بحثًا آخر.</div>`;return;}
 list.forEach(s=>{
  const d=document.createElement("div");d.className="story-card";
  d.innerHTML=`<div class="story-art">${s.art}</div><div class="story-body">
   <span class="badge ${s.doc?"b-doc":"b-fic"}">${s.doc?"✅ موثقة":"💡 خيالية"}</span>
   <span class="badge b-val">${esc(s.value)}</span> <span class="badge b-age">👶 ${s.age}</span>
   <h3>${esc(s.title)}</h3><div class="meta">${esc(s.catName)} • ⏱ ${s.mins} د • ${S.done[s.id]?"✅ مكتملة":"لم تُقرأ بعد"}</div>
   <div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-primary" style="flex:1">📖 اقرأ</button>
   <button class="fav-btn ${S.fav.includes(s.id)?"on":""}" title="مفضلة">${S.fav.includes(s.id)?"❤️":"🤍"}</button></div></div>`;
  d.querySelector(".btn").onclick=e=>{e.stopPropagation();openStory(s.id);};
  d.querySelector(".fav-btn").onclick=e=>{e.stopPropagation();toggleFav(s.id);};
  d.onclick=()=>openStory(s.id);
  g.appendChild(d);});
}
function toggleFav(id){const i=S.fav.indexOf(id);if(i>=0)S.fav.splice(i,1);else{S.fav.push(id);addStars(1);toast("💖 أضفتها للمفضلة! +1 ⭐");checkBadges();}save();renderLib();}

// القارئ
let R={id:null,scene:0,quizIdx:0,score:0,answers:[]};
function openStory(id){
 const s=STORIES.find(x=>x.id===id);if(!s)return;
 R={id,scene:0,quizIdx:0,score:0,answers:[]};stopSpeak();
 nav("reader");renderReader();
}
function renderReader(){
 const s=STORIES.find(x=>x.id===R.id);
 const sc=s.scenes[R.scene];
 const total=s.scenes.length;
 $("readerBox").innerHTML=`
 <button class="btn" onclick="stopSpeak();nav('lib')">→ العودة للمكتبة</button>
 <h2 style="margin:10px 0">${s.art} ${esc(s.title)}</h2>
 <div><span class="badge ${s.doc?"b-doc":"b-fic"}">${s.doc?"✅ قصة دينية موثقة":"💡 قصة خيالية مبتكرة للتعلم"}</span>
 <span class="badge b-val">💎 ${esc(s.value)}</span> <span class="badge b-age">⏱ ${s.mins} دقائق</span></div>
 <p class="meta">📚 المصدر: ${esc(s.source)}</p>
 <div class="scene-art">${sc.art}</div>
 <div class="scene-text">${esc(sc.text)}</div>
 <div class="dots">${s.scenes.map((_,i)=>`<div class="dot ${i===R.scene?"on":""}" onclick="goScene(${i})"></div>`).join("")}</div>
 <div class="scene-nav">
  <button class="btn" ${R.scene===0?"disabled":""} onclick="goScene(${R.scene-1})">السابق ←</button>
  <button class="btn btn-soft" onclick="speakCurrent()">${speaking?"⏸ إيقاف الصوت":"🔊 استمع"}</button>
  ${R.scene<total-1?`<button class="btn btn-primary" onclick="goScene(${R.scene+1})">التالي →</button>`
   :`<button class="btn btn-gold" onclick="finishStory()">🎉 أنهيت القصة! العبرة والنشاط</button>`}
 </div>
 <div class="meta">المشهد ${R.scene+1} من ${total} — ${s.doc?"هذه قصة موثقة من مصادر صحيحة، لا يجوز تغيير أحداثها.":"هذه قصة خيالية للتعلم وليست من السيرة."}</div>`;
}
function goScene(i){const s=STORIES.find(x=>x.id===R.id);if(i<0||i>=s.scenes.length)return;stopSpeak();R.scene=i;renderReader();}
function finishStory(){
 const s=STORIES.find(x=>x.id===R.id);stopSpeak();
 const first=!S.done[s.id];
 if(first){S.done[s.id]={date:todayStr};addStars(5);toast("🎉 أحسنت! +5 ⭐");}else{addStars(1);}
 save();checkBadges();
 $("readerBox").innerHTML=`<div class="celebrate">🎉⭐🎉</div>
 <h2 style="text-align:center">أحسنت يا ${esc(S.name)}!</h2>
 <div class="card" style="background:var(--gold-soft);border-color:var(--gold)"><b>💎 العبرة:</b><br>${esc(s.lesson)}</div>
 <p class="meta">📚 المصدر: ${esc(s.source)}</p>
 <h3>🎮 الآن: نشاط ممتع عن القصة (+2 ⭐ لكل إجابة صحيحة)</h3>
 <div id="quizBox"></div>
 <div class="scene-nav"><button class="btn" onclick="openStory('${s.id}')">🔁 اقرأ مرة أخرى</button>
 <button class="btn btn-primary" onclick="stopSpeak();nav('lib')">📚 قصة جديدة</button></div>`;
 R.quizIdx=0;R.score=0;R.answers=[];renderQuiz();
}
function renderQuiz(){
 const s=STORIES.find(x=>x.id===R.id);
 const q=s.quiz[R.quizIdx];
 const box=$("quizBox");
 if(!q){
  const key=s.id;
  const prev=(S.quiz[key]&&S.quiz[key].best)||0;
  if(R.score>prev)S.quiz[key]={best:R.score,total:s.quiz.length,answers:R.answers};
  save();renderTop();
  box.innerHTML=`<div class="card" style="text-align:center"><div class="celebrate">${R.score===s.quiz.length?"🏆":"🌟"}</div>
  <h3>نتيجتك: ${R.score} من ${s.quiz.length}!</h3>
  <p>${R.score===s.quiz.length?"ممتاز! أنت بطل الحكايات! 🎉":"أحسنت المحاولة! كل خطأ يعلمنا شيئًا جديدًا 💛"}</p>
  <button class="btn btn-gold" onclick="doChallenge('${s.id}')">🎯 انتقل لتحدي اليوم</button></div>`;
  return;
 }
 box.innerHTML=`<div class="card"><b>سؤال ${R.quizIdx+1} من ${s.quiz.length}: ${esc(q.q)}</b><div id="opts"></div><div id="exp"></div></div>`;
 const o=$("opts");
 q.opts.forEach((t,i)=>{
  const b=document.createElement("button");b.className="quiz-opt";b.textContent=t;
  b.onclick=()=>{
   const ok=(i===q.a);
   R.answers.push({q:q.q,ok});
   [...o.children].forEach((c,j)=>{c.disabled=true;if(j===q.a)c.classList.add("correct");});
   if(!ok)b.classList.add("wrong");
   if(ok){R.score++;addStars(2);}
   $("exp").innerHTML=`<div class="explain ${ok?"ok":"no"}">${ok?"🌟 أحسنت! إجابة صحيحة! ":"💛 إجابة قريبة! الصحيح: "+esc(q.opts[q.a])+". "}${esc(q.why)}</div>
   <button class="btn btn-primary" onclick="nextQ()">التالي →</button>`;
   save();
  };
  o.appendChild(b);});
}
function nextQ(){R.quizIdx++;renderQuiz();}

// التحديات
function renderCh(){
 const rows=STORIES.map(s=>{
  const k=s.id+"_"+todayStr;const dn=!!S.chDone[k];
  return `<div class="card"><div style="font-size:40px">${s.art}</div><b>${esc(s.challenge.value)}</b><p>${esc(s.challenge.task)}</p>
  <div class="meta">مرتبط بقصة: ${esc(s.title)}</div>
  <button class="btn ${dn?"btn-soft":"btn-gold"}" onclick="doChallenge('${s.id}')">${dn?"✅ تم اليوم!":"🌟 أنجزت التحدي"}</button></div>`;}).join("");
 $("chGrid").innerHTML=rows;
 const n=Object.keys(S.chDone).length;
 $("chCount").textContent=`أنجزت ${n} تحديًا — التحديات للتشجيع فقط وليست للحكم عليك 💛`;
}
function doChallenge(id){
 const k=id+"_"+todayStr;
 if(S.chDone[k]){toast("أنجزته اليوم! تعال غدًا لتحدٍ جديد 💛");return;}
 S.chDone[k]=true;addStars(3);save();checkBadges();
 toast("🏅 رائع! +3 ⭐ أنت تطبق ما تتعلم!");
 if($("v-home").classList.contains("active"))renderHome();
 renderCh();
}

// الإنجازات
function myBadges(){
 const b=[];const dn=Object.keys(S.done).length;
 if(dn>=1)b.push("reader1");if(dn>=5)b.push("reader5");
 const hasV=v=>STORIES.some(s=>S.done[s.id]&&s.value.includes(v));
 if(hasV("الصدق"))b.push("sidq");if(hasV("الرحمة")||hasV("الرفق"))b.push("rahma");if(hasV("الصبر"))b.push("sabr");
 if(Object.keys(S.chDone).length>=3)b.push("challenge3");
 if(S.fav.length>=1)b.push("fav");
 return b;
}
function checkBadges(){save();}
function renderAch(){
 const mine=myBadges();
 $("achStars").innerHTML=`⭐ ${S.stars} نجمة • 📖 ${Object.keys(S.done).length} قصص • 🎯 ${Object.keys(S.chDone).length} تحديات`;
 const total=STORIES.length,dn=Object.keys(S.done).length;
 $("achProg").style.width=Math.round(dn/total*100)+"%";
 $("badgeGrid").innerHTML=BADGES.map(b=>{
  const w=mine.includes(b.id);
  return `<div class="badge-card ${w?"won":"locked"}"><div class="e">${w?b.e:"🔒"}</div><b>${b.n}</b><div class="meta">${b.d}</div></div>`;}).join("");
 const rows=STORIES.filter(s=>S.done[s.id]).map(s=>`<tr><td>${s.art} ${esc(s.title)}</td><td>${esc(s.value)}</td><td>${S.done[s.id].date||""}</td></tr>`).join("");
 $("doneTable").innerHTML=rows?`<table><tr><th>القصة</th><th>القيمة</th><th>التاريخ</th></tr>${rows}</table>`:"لم تكمل أي قصة بعد — هيا نبدأ! 📖";
}

// الأهل
let gateA=0,gateB=0;
function newGate(){gateA=3+Math.floor(Math.random()*6);gateB=2+Math.floor(Math.random()*6);$("gateQ").textContent=`للدخول: كم ${gateA} + ${gateB} = ؟`;}
function tryGate(){const v=parseInt($("gateA").value||"0");if(v===gateA+gateB){$("gate").style.display="none";$("parentIn").style.display="block";renderParent();}else{toast("إجابة غير صحيحة — هذه المنطقة للأهل 👨‍👩‍👧");newGate();}}
function renderParent(){
 renderTop();
 $("pName").value=S.name;$("pAge").value=S.age;$("pLevel").value=S.level;$("pFs").value=S.fs;$("pSound").checked=!!S.sound;
 const dn=Object.keys(S.done).length;
 $("pStats").innerHTML=`<div class="cards three">
  <div class="card">📖 القصص المكتملة<b style="display:block;font-size:24px">${dn} / ${STORIES.length}</b></div>
  <div class="card">⭐ النجوم<b style="display:block;font-size:24px">${S.stars}</b></div>
  <div class="card">🎯 التحديات<b style="display:block;font-size:24px">${Object.keys(S.chDone).length}</b></div></div>`;
 const vals=[...new Set(STORIES.filter(s=>S.done[s.id]).map(s=>s.value))];
 $("pVals").innerHTML=vals.length?vals.map(v=>`<span class="badge b-val">${esc(v)}</span>`).join(""):"لم يتعلم قيمًا بعد.";
 const qrows=Object.entries(S.quiz).map(([id,v])=>{const s=STORIES.find(x=>x.id===id);return `<tr><td>${s?esc(s.title):id}</td><td>${v.best} / ${v.total}</td></tr>`;}).join("");
 $("pQuiz").innerHTML=qrows?`<table><tr><th>القصة</th><th>أفضل نتيجة</th></tr>${qrows}</table>`:"لا توجد إجابات بعد.";
 const chrows=Object.keys(S.chDone).map(k=>`<tr><td>${esc(k)}</td></tr>`).join("");
 $("pCh").innerHTML=chrows?`<table><tr><th>التحدي المنجز</th></tr>${chrows}</table>`:"لا توجد تحديات منجزة بعد.";
 $("pActs").innerHTML=FAMILY_ACTS.map(a=>`<li>${a}</li>`).join("");
}
function saveParent(){
 S.name=$("pName").value.trim()||"صديقي الصغير";
 S.age=parseInt($("pAge").value)||6;
 S.level=$("pLevel").value;S.fs=parseInt($("pFs").value)||17;S.sound=$("pSound").checked;
 save();renderTop();toast("✅ حُفظت إعدادات الطفل");renderParent();
}
function resetAll(){if(!confirm("مسح كل التقدم؟"))return;const n=S.name,a=S.age;S={name:n,age:a,stars:0,done:{},quiz:{},fav:[],chDone:{},chDate:todayStr,dayIdx:S.dayIdx,fs:17,sound:true,level:"all",acts:{}};save();renderTop();renderHome();renderLib();toast("تم التصفير ↺");}

// الصوت (Web Speech API)
let speaking=false,utter=null;
function stopSpeak(){try{speechSynthesis.cancel();}catch(e){}speaking=false;}
function speakCurrent(){
 if(!S.sound){toast("🔇 الصوت متوقف — فعّله من لوحة الأهل");return;}
 const s=STORIES.find(x=>x.id===R.id);const t=s.scenes[R.scene].text;
 try{
  if(speaking){speechSynthesis.cancel();speaking=false;renderReader();return;}
  utter=new SpeechSynthesisUtterance(t);utter.lang="ar-SA";utter.rate=.9;
  utter.onend=()=>{speaking=false;try{renderReader();}catch(e){}};
  speechSynthesis.speak(utter);speaking=true;renderReader();
 }catch(e){toast("الصوت غير مدعوم على هذا المتصفح");}
}

// بحث وفلتر
function bindLib(){
 $("q").oninput=e=>{F.q=e.target.value;renderLib();};
 $("fCat").onchange=e=>{F.cat=e.target.value;renderLib();};
 $("fAge").onchange=e=>{F.age=e.target.value;renderLib();};
 $("fFav").onclick=()=>{F.onlyFav=!F.onlyFav;$("fFav").textContent=F.onlyFav?"❤️ عرض الكل":"🤍 المفضلة فقط";renderLib();};
}

// init
window.openStory=openStory;window.goScene=goScene;window.finishStory=finishStory;window.nextQ=nextQ;
window.doChallenge=doChallenge;window.toggleFav=toggleFav;window.nav=nav;window.stopSpeak=stopSpeak;
window.speakCurrent=speakCurrent;window.tryGate=tryGate;window.saveParent=saveParent;window.resetAll=resetAll;
document.querySelectorAll(".bottom-nav button").forEach(b=>b.onclick=()=>{stopSpeak();nav(b.dataset.v);if(b.dataset.v==="lib")renderLib();if(b.dataset.v==="ch")renderCh();});
bindLib();renderTop();renderHome();renderLib();renderCh();newGate();

// رابط مباشر: index.html?story=<id> يفتح القصة فورًا (يُستخدم من صفحة مصادر الحكايات)
try{
 const sp=new URLSearchParams(location.search).get("story");
 if(sp&&STORIES.some(s=>s.id===sp))openStory(sp);
}catch(e){}

// PWA: زر التثبيت — يظهر فقط عندما يكون التثبيت متاحًا فعليًا (لا زر وهمي)
(function(){
 const btn=$("installBtn");if(!btn)return;
 const standalone=(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)||window.navigator.standalone===true;
 if(standalone)return; // التطبيق مثبت بالفعل
 const iOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
 let deferred=null;
 window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;btn.style.display="inline-block";});
 if(iOS)btn.style.display="inline-block"; // على الآيفون: يشرح الخطوات الحقيقية في «المشاركة ← إضافة إلى الشاشة الرئيسية»
 btn.onclick=async ()=>{
  if(deferred){deferred.prompt();try{const r=await deferred.userChoice;if(r&&r.outcome==="accepted")toast("🎉 ستظهر أيقونة التطبيق في شاشتك الرئيسية!");}catch(e){}deferred=null;btn.style.display="none";}
  else if(iOS){toast("📱 على الآيفون: زر المشاركة ⬆️ ثم «إضافة إلى الشاشة الرئيسية»");}
  else{toast("التثبيت غير متاح في هذا المتصفح — أضف الصفحة إلى المفضلة 💛");btn.style.display="none";}
 };
 window.addEventListener("appinstalled",()=>{btn.style.display="none";toast("🎉 تم تثبيت التطبيق! أحسنت");});
})();
