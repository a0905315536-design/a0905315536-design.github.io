var storeKey = "core-os-clean-v1";
var library = {
  upper: {
    label: "上半身",
    muscles: {
      chest: { label: "胸部", items: ["伏地挺身","平板槓鈴臥推","啞鈴臥推","上斜啞鈴推舉","上斜啞鈴飛鳥","器械胸推","十字夾胸","雙槓臂屈伸","下斜槓鈴臥推","窄距槓鈴臥推"] },
      shoulder: { label: "肩部", items: ["啞鈴肩上推舉","槓鈴肩上推舉","阿諾德推舉","側平舉","反向飛鳥","槓鈴片前平舉","啞鈴前舉","槓鈴直立划船","啞鈴聳肩","史密斯肩推"] },
      back: { label: "背部", items: ["引體向上","寬握下拉","坐姿繩索划船","俯身槓鈴划船","單臂啞鈴划船","T型杆划船","反向划船","山羊挺身","超人式"] },
      biceps: { label: "二頭", items: ["槓鈴彎舉","啞鈴彎舉","交替啞鈴彎舉","牧師椅彎舉","錘式彎舉","繩索彎舉","集中彎舉","反握引體向上"] },
      triceps: { label: "三頭", items: ["窄距臥推","繩索下壓","仰臥臂屈伸","啞鈴頸後臂屈伸","雙槓臂屈伸","板凳撐體","單臂繩索下壓","俯身啞鈴臂屈伸"] },
      abs: { label: "腹部", items: ["棒式","仰臥起坐","負重仰臥起坐","反向卷腹","懸垂腿舉","仰臥抬腿","繩索卷腹","登山者"] }
    }
  },
  lower: {
    label: "下半身",
    muscles: {
      thigh: { label: "大腿", items: ["槓鈴深蹲","頸前深蹲","哈克深蹲","腿舉","腿屈伸","箭步蹲行走","槓鈴箭步蹲","保加利亞分腿蹲","直腿硬拉","坐姿腿彎舉","站姿腿彎舉"] },
      calf: { label: "小腿", items: ["站姿提踵","單腳站姿提踵","坐姿提踵","騎驢提踵","腿舉器提踵"] }
    }
  }
};
var base = {
  profile: { currentWeight: 70, targetWeight: 70, height: 170, proteinGoal: 120, calorieGoal: 2200, weightYear: new Date().getFullYear() },
  meals: [],
  quicks: [],
  combos: [],
  history: {},
  weightHistory: {},
  currentDay: todayKey(),
  undoToday: null,
  training: { zone: "upper", muscle: "chest", selectedExercise: "", editingSet: null, sets: [], minutes: 0, custom: {}, hidden: {} }
};
var state = load();

function id(x){ return document.getElementById(x); }
function esc(t){ return String(t || "").replace(/[&<>'"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]; }); }
function num(x){ return Math.round(Number(x) || 0); }
function finite(v,f){ v = Number(v); return Number.isFinite(v) ? v : f; }
function clamp(v,min,max,f){ v = finite(v,f); return Math.min(max, Math.max(min, v)); }
function readNumber(name,min,max,f){ return clamp(id(name).value, min, max, f); }
function cleanText(v,max){ return String(v || "").trim().slice(0, max || 80); }
function bodyWeight(){ return Number(state.profile.currentWeight) || 70; }
function targetWeight(){ return Number(state.profile.targetWeight) || bodyWeight(); }
function taipeiDate(d){
  var parts = new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d || new Date());
  var o = {}; parts.forEach(function(p){ o[p.type] = p.value; });
  return new Date(+o.year, +o.month - 1, +o.day);
}
function dateKey(d){
  var x = taipeiDate(d);
  return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0");
}
function todayKey(){ return dateKey(new Date()); }
function keyDateLabel(key){ var a = key.split("-"); return Number(a[1]) + "/" + Number(a[2]); }
function monthKey(d){ var x = taipeiDate(d || new Date()); return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0"); }
function weekStart(){
  var x = taipeiDate(new Date());
  x.setDate(x.getDate() - ((x.getDay()+6)%7));
  return x;
}
function weekKeys(){
  var start = weekStart(), names = ["一","二","三","四","五","六","日"];
  return names.map(function(name,i){
    var d = new Date(start); d.setDate(start.getDate()+i);
    var key = dateKey(d);
    return { key:key, label:name, dateText:keyDateLabel(key), isToday:key === todayKey() };
  });
}

function load(){
  try{
    var raw = JSON.parse(localStorage.getItem(storeKey) || "null");
    var c = JSON.parse(JSON.stringify(base));
    if(!raw) return c;
    Object.assign(c.profile, raw.profile || {});
    c.meals = Array.isArray(raw.meals) ? raw.meals : [];
    c.quicks = Array.isArray(raw.quicks) ? raw.quicks : [];
    c.combos = Array.isArray(raw.combos) ? raw.combos : [];
    c.history = raw.history && typeof raw.history === "object" ? raw.history : {};
    c.weightHistory = raw.weightHistory && typeof raw.weightHistory === "object" ? raw.weightHistory : {};
    Object.assign(c.training, raw.training || {});
    if(!library[c.training.zone]) c.training.zone = "upper";
    if(!library[c.training.zone].muscles[c.training.muscle]) c.training.muscle = "chest";
    if(!Array.isArray(c.training.sets)) c.training.sets = [];
    if(!c.training.custom || typeof c.training.custom !== "object") c.training.custom = {};
    if(!c.training.hidden || typeof c.training.hidden !== "object") c.training.hidden = {};
    c.currentDay = raw.currentDay || todayKey();
    if(c.currentDay !== todayKey()){
      c.meals = [];
      c.training.sets = [];
      c.training.minutes = 0;
      c.training.editingSet = null;
      c.currentDay = todayKey();
    }
    return c;
  }catch(e){
    return JSON.parse(JSON.stringify(base));
  }
}
function save(){ localStorage.setItem(storeKey, JSON.stringify(state)); }
function makeSnapshot(reason){
  localStorage.setItem(storeKey + "-snapshot", JSON.stringify({ reason: reason || "備份", date: new Date().toISOString(), state: state }));
}
function restoreSnapshot(){
  var pack = JSON.parse(localStorage.getItem(storeKey + "-snapshot") || "null");
  if(!pack) return alert("目前沒有可還原的本機備份。");
  state = pack.state || pack;
  save(); render();
}

function dayRecord(key){
  if(!state.history[key]) state.history[key] = { sets: [], minutes: 0, protein: 0 };
  return state.history[key];
}
function syncToday(){
  state.currentDay = todayKey();
  var rec = dayRecord(todayKey());
  rec.sets = state.training.sets.slice();
  rec.minutes = state.training.minutes || 0;
  rec.protein = total("protein");
}
function total(field){ return state.meals.reduce(function(a,b){ return a + (Number(b[field]) || 0); }, 0); }
function muscle(){ return library[state.training.zone].muscles[state.training.muscle]; }
function mkey(){ return state.training.zone + ":" + state.training.muscle; }
function allMuscleOptions(){
  var out = [];
  Object.keys(library).forEach(function(zone){
    Object.keys(library[zone].muscles).forEach(function(muscle){
      out.push({ zone: zone, muscle: muscle, label: library[zone].muscles[muscle].label });
    });
  });
  return out;
}
function hiddenExercises(){ return state.training.hidden[mkey()] || []; }
function exercises(){
  var hidden = hiddenExercises();
  return muscle().items.concat(state.training.custom[mkey()] || []).filter(function(n){ return hidden.indexOf(n) === -1; });
}
function difficulty(n){
  if(/引體|屈伸|深蹲|硬拉|臥推|划船|腿舉|槓鈴|懸垂/.test(n)) return 1.35;
  if(/啞鈴|器械|下拉|推舉|飛鳥|箭步|彎舉|提踵|卷腹/.test(n)) return 1.15;
  return 1.05;
}
function recalcMinutes(){ state.training.minutes = state.training.sets.reduce(function(a,s){ return a + Math.max(4, (Number(s.sets)||1)*2); }, 0); }
function cleanSet(s){
  s = s || {};
  return {
    id: Number(s.id) || Date.now(),
    exercise: cleanText(s.exercise,80) || "自訂動作",
    reps: clamp(s.reps,1,1000,1),
    sets: clamp(s.sets,1,100,1),
    weight: clamp(s.weight,0,500,0),
    rpe: clamp(s.rpe,1,10,7),
    rest: clamp(s.rest,0,1800,90),
    difficulty: clamp(s.difficulty,.5,2,difficulty(s.exercise || "")),
    zone: library[s.zone] ? s.zone : state.training.zone,
    muscle: s.muscle || state.training.muscle,
    muscleLabel: cleanText(s.muscleLabel,20) || muscle().label
  };
}
function findExerciseLocation(name){
  var zones = Object.keys(library);
  for(var zi=0; zi<zones.length; zi++){
    var zone = zones[zi], muscles = library[zone].muscles, keys = Object.keys(muscles);
    for(var mi=0; mi<keys.length; mi++){
      var m = keys[mi];
      if(muscles[m].items.indexOf(name) !== -1 || (state.training.custom[zone + ":" + m] || []).indexOf(name) !== -1){
        return { zone: zone, muscle: m, label: muscles[m].label };
      }
    }
  }
  return { zone: state.training.zone, muscle: state.training.muscle, label: muscle().label };
}

function addMeal(item){ state.meals.push(Object.assign({ id: Date.now() }, item)); syncToday(); render(); }
function deleteExercise(name){
  var key = mkey();
  if(!state.training.hidden[key]) state.training.hidden[key] = [];
  if(state.training.hidden[key].indexOf(name) === -1) state.training.hidden[key].push(name);
  if(state.training.selectedExercise === name) state.training.selectedExercise = "";
  render();
}
function chooseExercise(name){
  var loc = findExerciseLocation(name);
  state.training.zone = loc.zone;
  state.training.muscle = loc.muscle;
  state.training.selectedExercise = name;
  state.training.editingSet = null;
  id("setForm").reset();
  id("setSubmitBtn").textContent = "加入訓練紀錄";
  id("cancelEditSet").hidden = true;
  renderTraining();
  openSetDialog();
}
function openSetDialog(){ var d = id("setDialog"); if(d && !d.open) d.showModal(); setTimeout(function(){ id("repsInput").focus(); }, 50); }
function closeSetDialog(){ var d = id("setDialog"); if(d && d.open) d.close(); }

function exerciseRecords(name){
  var out = [], seen = {};
  function add(s,date){
    if(!s || s.exercise !== name) return;
    var key = (s.id || "") + "|" + date + "|" + s.reps + "|" + s.sets + "|" + s.weight;
    if(seen[key]) return;
    seen[key] = 1;
    out.push(Object.assign({ date: date }, s));
  }
  state.training.sets.forEach(function(s){ add(s, todayKey()); });
  Object.keys(state.history || {}).forEach(function(date){ (state.history[date].sets || []).forEach(function(s){ add(s,date); }); });
  return out.sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); });
}
function setVolume(s){
  var w = Number(s.weight) || Math.max(20, bodyWeight() * .35);
  return Math.round(w * (Number(s.reps)||0) * (Number(s.sets)||0) * (Number(s.difficulty)||difficulty(s.exercise)));
}

function mealHtml(item,i){
  return '<article class="card"><div class="row"><div><h4>'+esc(item.name)+'</h4><p>碳水 '+num(item.carbs)+'g · 脂肪 '+num(item.fat)+'g · '+num(item.calories)+' kcal</p></div><div><div class="macro">'+num(item.protein)+'g 蛋白</div><button class="danger" data-rm-meal="'+i+'">刪除</button></div></div></article>';
}
function setHtml(item,i){
  return '<div class="card"><div class="row"><div><h4>'+esc(item.exercise)+'</h4><p>'+esc(item.muscleLabel)+' · '+num(item.reps)+' 下 × '+num(item.sets)+' 組 · '+(Number(item.weight)||0)+' kg</p><p>RPE '+(item.rpe||"-")+' · 休息 '+(item.rest||0)+' 秒 · 難度 ×'+(Number(item.difficulty)||difficulty(item.exercise)).toFixed(2)+'</p></div><div class="mini-actions"><button class="mini-btn pick" data-edit-set="'+i+'">編輯</button><button class="danger" data-rm-set="'+i+'">刪除</button></div></div></div>';
}

function render(){
  renderHome();
  renderMeals();
  renderTraining();
  renderProfile();
  save();
}
function renderHome(){
  syncToday();
  var protein = total("protein"), calories = total("calories");
  var proteinPct = Math.min(100, protein / Math.max(1, state.profile.proteinGoal) * 100);
  var caloriePct = Math.min(100, calories / Math.max(1, state.profile.calorieGoal) * 100);
  id("proteinNow").textContent = num(protein);
  id("calorieNow").textContent = num(calories);
  id("proteinGoalText").textContent = num(state.profile.proteinGoal);
  id("calorieGoalText").textContent = num(state.profile.calorieGoal);
  id("proteinLiquid").style.height = proteinPct + "%";
  id("calorieLiquid").style.height = caloriePct + "%";
  id("trainingSummary").textContent = state.training.sets.length ? state.training.sets.length + " 筆 · 約 " + num(state.training.minutes) + " 分鐘" : "尚未開始";
  id("todaySets").innerHTML = state.training.sets.length ? state.training.sets.slice(-3).reverse().map(function(x,ri){ return setHtml(x,state.training.sets.length-1-ri); }).join("") : '<p class="empty">還沒有訓練紀錄，去訓練頁選一個動作開始。</p>';
  id("dailyQuoteText").textContent = dailyQuote();
  renderProteinChart();
  renderIntensityChart();
}
function renderMeals(){
  var qs = state.quicks || [];
  var comboHtml = (state.combos || []).map(function(q,i){ return '<button class="chip combo-chip" data-combo="'+i+'">'+esc(q.name)+' +'+num(q.protein)+'g</button>'; }).join("");
  id("quickButtons").innerHTML = qs.map(function(q){
    return '<button class="chip" data-quick="'+esc(q.name)+'" data-protein="'+num(q.protein)+'" data-calories="'+num(q.calories)+'" data-carbs="'+num(q.carbs)+'" data-fat="'+num(q.fat)+'">'+esc(q.name)+' +'+num(q.protein)+'g</button>';
  }).join("") + comboHtml + '<button class="chip add-chip plus-only" id="openMealTool" type="button">+</button>';
  var manage = "";
  if(state.quicks.length){
    manage += '<p class="section-label">自訂快捷鍵</p>' + state.quicks.map(function(q,i){
      return '<div class="manage-item"><div><strong>'+esc(q.name)+'</strong><span>蛋白 '+num(q.protein)+'g · '+num(q.calories)+' kcal</span></div><button class="mini-btn danger" data-rm-quick="'+i+'">刪除</button></div>';
    }).join("");
  }
  if(state.combos.length){
    manage += '<p class="section-label">餐點組合</p>' + state.combos.map(function(q,i){
      return '<div class="manage-item"><div><strong>'+esc(q.name)+'</strong><span>蛋白 '+num(q.protein)+'g · '+num(q.calories)+' kcal</span></div><button class="mini-btn danger" data-rm-combo="'+i+'">刪除</button></div>';
    }).join("");
  }
  id("quickManage").innerHTML = manage || '<p class="empty">目前沒有自訂快捷鍵或餐點組合。</p>';
  id("mealCount").textContent = state.meals.length + " 筆";
  id("mealList").innerHTML = state.meals.length ? state.meals.map(mealHtml).join("") : '<p class="empty">還沒記餐點。可以用 + 新增自己的快捷鍵或餐點組合。</p>';
}
function renderTraining(){
  id("muscleButtons").innerHTML = allMuscleOptions().map(function(o){
    var active = state.training.zone === o.zone && state.training.muscle === o.muscle;
    return '<button type="button" class="chip '+(active?"active":"")+'" data-muscle="'+o.muscle+'" data-muscle-zone="'+o.zone+'">'+o.label+'</button>';
  }).join("");
  id("exerciseTitle").textContent = muscle().label + "動作";
  id("exerciseList").innerHTML = exercises().map(function(n){
    return '<div class="manage-item"><div><strong>'+esc(n)+'</strong></div><div class="mini-actions"><button class="mini-btn pick" data-exercise="'+esc(n)+'">選擇</button><button type="button" class="mini-btn danger" data-delete-exercise="'+esc(n)+'">刪除</button></div></div>';
  }).join("") || '<p class="empty">這個部位目前沒有動作。</p>';
  id("selectedExerciseText").textContent = state.training.selectedExercise || "請先選動作";
  renderExerciseProgress();
}
function renderExerciseProgress(){
  var box = id("exerciseProgress"), name = state.training.selectedExercise;
  if(!name){ box.className = "progress-box"; box.innerHTML = ""; return; }
  var records = exerciseRecords(name);
  box.className = "progress-box show";
  if(!records.length){
    box.innerHTML = '<strong>'+esc(name)+'</strong><p>這個動作還沒有歷史紀錄，今天記下第一筆後就會開始追蹤。</p>';
    return;
  }
  var last = records[records.length-1];
  var bestWeight = records.reduce(function(best,r){ return (Number(r.weight)||0) > (Number(best.weight)||0) ? r : best; }, {weight:0});
  var bestVolume = records.reduce(function(best,r){ return setVolume(r) > setVolume(best) ? r : best; }, {reps:0,sets:0,weight:0,difficulty:1});
  box.innerHTML = '<strong>'+esc(name)+' 進步追蹤</strong><div class="progress-metrics"><div class="progress-metric"><span>上次</span><b>'+keyDateLabel(last.date)+' · '+num(last.reps)+'×'+num(last.sets)+'</b></div><div class="progress-metric"><span>最佳重量</span><b>'+(Number(bestWeight.weight)||0)+' kg</b></div><div class="progress-metric"><span>最高量</span><b>'+setVolume(bestVolume)+'</b></div></div>';
}
function renderProfile(){
  id("currentWeightInput").value = bodyWeight();
  id("targetWeightInput").value = targetWeight();
  id("heightInput").value = state.profile.height;
  id("proteinGoalInput").value = state.profile.proteinGoal;
  id("calorieGoalInput").value = state.profile.calorieGoal;
  id("dateText").textContent = new Date().toLocaleDateString("zh-TW",{timeZone:"Asia/Taipei",month:"long",day:"numeric",weekday:"short"});
  var bmi = bmiValue();
  id("dailyReview").innerHTML = '<div class="grid two compact"><div class="metric"><p class="label">BMI</p><p class="value">'+(bmi?bmi.toFixed(1):"--")+'</p><p class="note">'+(bmi?bmiLabel(bmi):"請輸入身高體重")+'</p></div><div class="metric"><p class="label">蛋白質完成</p><p class="value">'+Math.min(100,num(total("protein")/state.profile.proteinGoal*100))+'%</p><p class="note">'+num(total("protein"))+' / '+num(state.profile.proteinGoal)+'g</p></div><div class="metric"><p class="label">訓練組數</p><p class="value">'+state.training.sets.length+'</p><p class="note">約 '+num(state.training.minutes)+' 分鐘</p></div><div class="metric"><p class="label">身高體重</p><p class="value">'+num(state.profile.height)+'cm</p><p class="note">'+bodyWeight()+' kg · 目標 '+targetWeight()+' kg</p></div></div>';
  renderWeightChart();
}

function bmiValue(){ var h = Number(state.profile.height)/100; return h ? bodyWeight()/(h*h) : 0; }
function bmiLabel(v){ return v < 18.5 ? "偏輕" : v < 24 ? "正常" : v < 27 ? "過重" : "偏高"; }
function dailyQuote(){
  var quotes = ["不是每天都要很強，但每天都可以更靠近目標。","先完成今天的一組，未來的你會感謝現在的你。","訓練不是懲罰身體，是投資身體。","穩定比完美更有力量。","多一次紀錄，就多一點掌控。"];
  var now = taipeiDate(new Date()), start = new Date(now.getFullYear(),0,0);
  return quotes[Math.floor((now-start)/86400000) % quotes.length];
}
function calcIntensity(rec){
  var sets = rec && rec.sets ? rec.sets : [], minutes = rec && rec.minutes ? rec.minutes : 0;
  var volume = 0, totalSets = 0, totalReps = 0, rpeLoad = 0, parts = {};
  sets.forEach(function(s){
    var st = Number(s.sets)||0, re = Number(s.reps)||0, w = Number(s.weight)||Math.max(20, bodyWeight()*.35), d = Number(s.difficulty)||difficulty(s.exercise), rpe = Number(s.rpe)||7;
    totalSets += st; totalReps += re*st; volume += w*re*st*d; rpeLoad += st*rpe*d;
    if(s.muscleLabel) parts[s.muscleLabel] = 1;
  });
  return Math.min(100, Math.round(Math.min(38, volume/180) + Math.min(18, totalReps*.18) + Math.min(16, totalSets*2.2) + Math.min(16, rpeLoad*1.15) + Math.min(8, Object.keys(parts).length*3) + Math.min(8, minutes*.25)));
}
function intensityLevel(score){ return score < 35 ? "偏低" : score < 70 ? "適中" : "偏高"; }
function renderProteinChart(){
  var days = weekKeys(), goal = Number(state.profile.proteinGoal)||120;
  var values = days.map(function(d){ return Number(dayRecord(d.key).protein)||0; });
  id("proteinChartLabel").textContent = "今日 " + num(values.find(function(_,i){return days[i].isToday;}) || 0) + "g / " + num(goal) + "g";
  id("proteinChart").innerHTML = oldProteinChartSvg(days, values, goal);
}
function renderIntensityChart(){
  var days = weekKeys(), values = days.map(function(d){ return calcIntensity(dayRecord(d.key)); });
  var today = values[days.findIndex(function(d){ return d.isToday; })] || 0;
  id("intensityLabel").textContent = "今日 " + today + " · " + intensityLevel(today);
  id("intensityChart").innerHTML = oldIntensityChartSvg(days, values);
  var max = Math.max.apply(null, values), idx = values.indexOf(max);
  var highStreak = 0;
  for(var i=days.findIndex(function(d){return d.isToday;}); i>=0; i--){ if(values[i] >= 70) highStreak++; else break; }
  id("weeklyAdvice").innerHTML = '<div class="advice-item"><strong>本週是否進步</strong>'+(today >= 35 ? "有維持訓練量，繼續累積。" : "今天訓練量偏低，可以補一點輕量活動。")+'</div><div class="advice-item"><strong>哪天強度最高</strong>'+(max ? "週"+days[idx].label+"，"+max+" 分。" : "目前還沒有訓練紀錄。")+'</div><div class="advice-item"><strong>是否連續太高，需要休息</strong>'+(highStreak >= 2 ? "已連續偏高，建議安排恢復或低強度。" : "目前沒有連續過高。")+'</div>';
}
function oldProteinChartSvg(days, values, goal){
  var w=360,h=176,left=42,right=24,baseY=134,topY=30;
  var max=Math.max(goal,Math.max.apply(null,values),1);
  var pts=values.map(function(v,i){var x=left+i*((w-left-right)/6),y=baseY-(Math.min(v,max)/max)*(baseY-topY);return {x:x,y:y,v:v};});
  var line=pts.map(function(p,i){return (i?"L":"M")+p.x.toFixed(1)+" "+p.y.toFixed(1);}).join(" ");
  var area="M"+pts[0].x+" "+baseY+" "+line+" L"+pts[6].x+" "+baseY+" Z";
  var goalY=baseY-(Math.min(goal,max)/max)*(baseY-topY),half=max/2;
  return '<svg class="protein-snapshot" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="本週蛋白質曲線"><defs><linearGradient id="proteinAreaOld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(123,227,162,.30)"/><stop offset="1" stop-color="rgba(123,227,162,0)"/></linearGradient></defs><text class="ai-label chart-title" x="'+left+'" y="26">蛋白量 g</text><path class="protein-base-axis" d="M'+left+' '+baseY+' H'+(w-right)+'"/><path class="protein-goal-axis" d="M'+left+' '+goalY.toFixed(1)+' H'+(w-right)+'"/><path fill="url(#proteinAreaOld)" d="'+area+'"/><path class="ai-line protein-line" d="'+line+'"/>'+pts.map(function(p,i){var over=p.v>goal,tip="週"+days[i].label+" "+days[i].dateText+"："+num(p.v)+"g",pointClass=days[i].isToday?"protein-today-dot":"protein-dot";return '<rect class="chart-hit" x="'+(p.x-24)+'" y="0" width="48" height="176" data-chart-target="proteinChartLabel" data-chart-tip="'+tip+'"/><circle class="'+pointClass+'" cx="'+p.x+'" cy="'+p.y+'" r="'+(days[i].isToday?6:4.5)+'"/><text class="'+(over?"protein-over":"protein-value")+'" x="'+p.x+'" y="'+(p.y-10)+'" text-anchor="middle">'+num(p.v)+'</text><text class="protein-day" x="'+p.x+'" y="164" text-anchor="middle">'+days[i].label+'</text><title>'+tip+'</title>';}).join("")+'<text class="protein-y-label" x="'+(left-8)+'" y="'+(topY+5)+'" text-anchor="end">'+num(max)+'</text><text class="protein-y-label" x="'+(left-8)+'" y="'+(baseY-(half/max)*(baseY-topY)+5)+'" text-anchor="end">'+num(half)+'</text><text class="protein-y-label" x="'+(left-8)+'" y="'+(baseY+4)+'" text-anchor="end">0</text><text class="protein-goal-label" x="'+(w-right-1)+'" y="'+(goalY-5)+'" text-anchor="end">目標</text></svg>';
}
function oldIntensityChartSvg(days, values){
  var w=360,h=176,left=42,right=24,baseY=134,topY=30;
  var pts=values.map(function(s,i){var x=left+i*((w-left-right)/6),y=baseY-(s/100)*(baseY-topY);return {x:x,y:y,s:s};});
  var line=pts.map(function(p,i){return (i?"L":"M")+p.x.toFixed(1)+" "+p.y.toFixed(1);}).join(" ");
  var area="M"+pts[0].x+" "+baseY+" "+line+" L"+pts[6].x+" "+baseY+" Z";
  return '<svg class="protein-snapshot intensity-snapshot" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="本週訓練強度曲線"><defs><linearGradient id="aiAreaOld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(96,226,232,.28)"/><stop offset="1" stop-color="rgba(96,226,232,0)"/></linearGradient></defs><text class="ai-label chart-title" x="'+left+'" y="26">訓練強度</text><path class="protein-base-axis" d="M'+left+' '+baseY+' H'+(w-right)+'"/><path class="ai-area" d="'+area+'"/><path class="ai-line" d="'+line+'"/>'+pts.map(function(p,i){var tip="週"+days[i].label+" "+days[i].dateText+"："+p.s+"分",pointClass=days[i].isToday?"protein-today-dot intensity-today":"protein-dot intensity-dot";return '<rect class="chart-hit" x="'+(p.x-24)+'" y="0" width="48" height="176" data-chart-target="intensityLabel" data-chart-tip="'+tip+'"/><circle class="'+pointClass+'" cx="'+p.x+'" cy="'+p.y+'" r="'+(days[i].isToday?6:4.5)+'"/><text class="protein-value" x="'+p.x+'" y="'+(p.y-10)+'" text-anchor="middle">'+p.s+'</text><text class="protein-day" x="'+p.x+'" y="164" text-anchor="middle">'+days[i].label+'</text><title>'+tip+'</title>';}).join("")+'<text class="protein-y-label" x="'+(left-8)+'" y="'+(topY+5)+'" text-anchor="end">100</text><text class="protein-y-label" x="'+(left-8)+'" y="'+(baseY-52+5)+'" text-anchor="end">50</text><text class="protein-y-label" x="'+(left-8)+'" y="'+(baseY+4)+'" text-anchor="end">0</text><text class="protein-goal-label" x="'+(w-right-1)+'" y="'+(topY+4)+'" text-anchor="end">強</text></svg>';
}
function weeklyChartSvg(opts){
  var days = opts.days, values = opts.values, max = Math.max(Number(opts.max)||1, 1), unit = opts.unit || "", goal = Number(opts.goal)||0;
  var w=320,h=150,pad=24,baseY=112,topY=16;
  var step = (w-pad*2)/6;
  var pts = values.map(function(v,i){ return { x:pad+i*step, y:baseY-(Math.min(v,max)/max)*(baseY-topY), v:v }; });
  var line = pts.map(function(p,i){ return (i?"L":"M")+p.x.toFixed(1)+" "+p.y.toFixed(1); }).join(" ");
  var area = "M"+pts[0].x+" "+baseY+" "+line+" L"+pts[6].x+" "+baseY+" Z";
  var goalY = goal ? baseY-(Math.min(goal,max)/max)*(baseY-topY) : 0;
  var half = max/2;
  var goalLine = goal ? '<path class="axis" stroke-dasharray="4 5" d="M'+pad+' '+goalY.toFixed(1)+' H'+(w-pad)+'"/><text class="chart-label" x="'+(w-pad)+'" y="'+(goalY-4)+'" text-anchor="end">目標</text>' : "";
  return '<svg viewBox="0 0 '+w+' '+h+'" role="img"><path class="axis" d="M'+pad+' '+baseY+' H'+(w-pad)+'"/><path class="axis" d="M'+pad+' '+topY+' V'+baseY+'"/>'+goalLine+'<path class="area" style="fill:'+chartAreaColor(opts.color)+'" d="'+area+'"/><path class="line" style="stroke:'+opts.color+';filter:drop-shadow(0 0 8px rgba(96,226,232,.32))" d="'+line+'"/>'+pts.map(function(p,i){ var over = goal && p.v > goal, tip = "週"+days[i].label+" "+days[i].dateText+"："+num(p.v)+unit; return '<rect class="chart-hit" x="'+(p.x-26)+'" y="0" width="52" height="150" data-chart-target="'+opts.target+'" data-chart-tip="'+tip+'"/><circle class="'+(days[i].isToday?"today-point":"point")+'" style="stroke:'+opts.color+'" cx="'+p.x+'" cy="'+p.y+'" r="4"/><text class="'+(over?"protein-over":"chart-score")+'" x="'+p.x+'" y="'+(p.y-9)+'" text-anchor="middle">'+num(p.v)+'</text><text class="chart-label" x="'+p.x+'" y="136" text-anchor="middle">'+days[i].label+'</text><title>'+tip+'</title>'; }).join("")+'<text class="chart-label" x="'+(pad-6)+'" y="'+(topY+4)+'" text-anchor="end">'+num(max)+'</text><text class="chart-label" x="'+(pad-6)+'" y="'+(baseY-(half/max)*(baseY-topY)+4)+'" text-anchor="end">'+num(half)+'</text><text class="chart-label" x="'+(pad-6)+'" y="'+(baseY+4)+'" text-anchor="end">0</text><text class="chart-label" x="'+pad+'" y="12">'+(opts.topLabel||"")+'</text><text class="chart-label" x="'+pad+'" y="124">'+(opts.bottomLabel||"")+'</text></svg>';
}
function chartAreaColor(color){
  return color === "var(--green)" ? "rgba(123,227,162,.18)" : color === "var(--blue)" ? "rgba(121,167,255,.18)" : "rgba(96,226,232,.16)";
}
function monthChartSvg(data, min, max, target){
  var w=340,h=170,pad=34,baseY=128,topY=18,range=Math.max(max-min,1);
  var step=(w-pad*2)/11;
  var pts=data.map(function(d,i){ var v=Number(d.v)||0; return {x:pad+i*step,y:v?baseY-((v-min)/range)*(baseY-topY):baseY,v:v,label:d.label}; });
  var segments=[],current=[];
  pts.forEach(function(p){ if(p.v){ current.push(p); } else if(current.length){ segments.push(current); current=[]; } });
  if(current.length) segments.push(current);
  var lines=segments.map(function(seg){ return seg.map(function(p,i){ return (i?"L":"M")+p.x.toFixed(1)+" "+p.y.toFixed(1); }).join(" "); });
  var area=segments.map(function(seg){ var line=seg.map(function(p,i){ return (i?"L":"M")+p.x.toFixed(1)+" "+p.y.toFixed(1); }).join(" "); return "M"+seg[0].x+" "+baseY+" "+line+" L"+seg[seg.length-1].x+" "+baseY+" Z"; }).join(" ");
  var mid=(max+min)/2;
  return '<svg viewBox="0 0 '+w+' '+h+'" role="img"><path class="axis" d="M'+pad+' '+baseY+' H'+(w-pad)+'"/><path class="axis" d="M'+pad+' '+topY+' V'+baseY+'"/><path class="area" style="fill:rgba(121,167,255,.16)" d="'+area+'"/>'+lines.map(function(line){return '<path class="line" style="stroke:var(--blue);filter:drop-shadow(0 0 8px rgba(121,167,255,.32))" d="'+line+'"/>';}).join("")+pts.map(function(p){ var tip=p.label+"："+(p.v?p.v.toFixed(1)+"kg":"無紀錄"); return '<rect class="chart-hit" x="'+(p.x-14)+'" y="4" width="28" height="146" data-chart-target="'+target+'" data-chart-tip="'+tip+'"/><circle class="point" style="stroke:var(--blue);opacity:'+(p.v?1:.35)+'" cx="'+p.x+'" cy="'+p.y+'" r="4"/><text class="chart-score" x="'+p.x+'" y="'+(p.y-9)+'" text-anchor="middle">'+(p.v?p.v.toFixed(1):"-")+'</text><text class="chart-label" x="'+p.x+'" y="154" text-anchor="middle">'+p.label+'</text>';}).join("")+'<text class="chart-label" x="'+(pad-6)+'" y="'+(topY+4)+'" text-anchor="end">'+max.toFixed(1)+'</text><text class="chart-label" x="'+(pad-6)+'" y="'+(baseY-((mid-min)/range)*(baseY-topY)+4)+'" text-anchor="end">'+mid.toFixed(1)+'</text><text class="chart-label" x="'+(pad-6)+'" y="'+(baseY+4)+'" text-anchor="end">'+min.toFixed(1)+'</text><text class="chart-label" x="'+pad+'" y="12">體重 kg</text></svg>';
}
function recordWeight(){
  var key = monthKey(new Date());
  if(!state.weightHistory[key]) state.weightHistory[key] = [];
  state.weightHistory[key].push({ date: todayKey(), weight: bodyWeight() });
  var seen = {};
  state.weightHistory[key] = state.weightHistory[key].reverse().filter(function(r){ if(seen[r.date]) return false; seen[r.date]=1; return true; }).reverse();
}
function renderWeightChart(){
  var year = Number(state.profile.weightYear) || new Date().getFullYear();
  var sel = id("weightYearSelect");
  sel.innerHTML = [year, year-1].map(function(y){ return '<option value="'+y+'" '+(year===y?"selected":"")+'>'+y+'年</option>'; }).join("");
  var data = Array.from({length:12},function(_,i){
    var key = year+"-"+String(i+1).padStart(2,"0"), arr = state.weightHistory[key] || [];
    var last = arr.length ? Number(arr[arr.length-1].weight)||0 : 0;
    if(key === monthKey(new Date())) last = bodyWeight();
    return { key:key, label:(i+1)+"月", v:last };
  });
  var vals = data.map(function(d){ return d.v; }).filter(Boolean), min = vals.length ? Math.min.apply(null,vals) : 0, max = vals.length ? Math.max.apply(null,vals) : 100;
  if(max === min){ max += 2; min = Math.max(0,min-2); }
  id("weightChartLabel").textContent = year + "年 · 目前 " + bodyWeight() + " kg · 目標 " + targetWeight() + " kg";
  id("weightChart").innerHTML = monthChartSvg(data, min, max, "weightChartLabel");
  id("weightStats").innerHTML = '<div class="stat-line"><strong>目前體重</strong>'+bodyWeight()+' kg · 目標 '+targetWeight()+' kg</div>';
}

function showScreen(name){
  document.querySelectorAll(".tab").forEach(function(t){ t.classList.toggle("active", t.dataset.tab === name); });
  document.querySelectorAll(".screen").forEach(function(s){ s.classList.toggle("active", s.dataset.screen === name); });
  scrollTo({ top: 0, behavior: "smooth" });
}
function toggleHomePanel(key){
  var panel = document.querySelector('[data-home-panel="'+key+'"]');
  if(panel) panel.classList.toggle("open");
}
function startEditSet(i){
  var s = state.training.sets[i]; if(!s) return;
  state.training.editingSet = i;
  chooseExercise(s.exercise);
  id("repsInput").value = s.reps;
  id("setsInput").value = s.sets;
  id("setWeightInput").value = s.weight || "";
  id("rpeInput").value = s.rpe || 7;
  id("restInput").value = s.rest || 90;
  id("setSubmitBtn").textContent = "更新訓練紀錄";
  id("cancelEditSet").hidden = false;
}
function cancelEdit(){
  state.training.editingSet = null;
  id("setForm").reset();
  id("setSubmitBtn").textContent = "加入訓練紀錄";
  id("cancelEditSet").hidden = true;
  closeSetDialog();
}

document.addEventListener("click", function(e){
  var tab = e.target.closest("[data-tab]"); if(tab){ showScreen(tab.dataset.tab); return; }
  var toggle = e.target.closest("[data-toggle-home]"); if(toggle){ toggleHomePanel(toggle.dataset.toggleHome); return; }
  var tip = e.target.closest("[data-chart-tip]"); if(tip){ var target = id(tip.dataset.chartTarget); if(target) target.textContent = tip.dataset.chartTip; return; }
  if(e.target.closest("#toggleQuickManage")){ id("quickManage").classList.toggle("collapsed"); return; }
  if(e.target.closest("#openMealTool")){ id("addMealToolDialog").showModal(); return; }
  var quick = e.target.closest("[data-quick]"); if(quick){ addMeal({ name:quick.dataset.quick, protein:+quick.dataset.protein, calories:+quick.dataset.calories, carbs:+quick.dataset.carbs, fat:+quick.dataset.fat }); return; }
  var combo = e.target.closest("[data-combo]"); if(combo){ var c = state.combos[+combo.dataset.combo]; if(c) addMeal(c); return; }
  var rmMeal = e.target.closest("[data-rm-meal]"); if(rmMeal){ state.meals.splice(+rmMeal.dataset.rmMeal,1); syncToday(); render(); return; }
  var rmQuick = e.target.closest("[data-rm-quick]"); if(rmQuick){ state.quicks.splice(+rmQuick.dataset.rmQuick,1); render(); return; }
  var rmCombo = e.target.closest("[data-rm-combo]"); if(rmCombo){ state.combos.splice(+rmCombo.dataset.rmCombo,1); render(); return; }
  var mus = e.target.closest("[data-muscle]"); if(mus){ state.training.zone = mus.dataset.muscleZone; state.training.muscle = mus.dataset.muscle; state.training.selectedExercise = ""; render(); return; }
  var ex = e.target.closest("[data-exercise]"); if(ex){ chooseExercise(ex.dataset.exercise); return; }
  var delEx = e.target.closest("[data-delete-exercise]"); if(delEx){ deleteExercise(delEx.dataset.deleteExercise); return; }
  var rmSet = e.target.closest("[data-rm-set]"); if(rmSet){ state.training.sets.splice(+rmSet.dataset.rmSet,1); recalcMinutes(); syncToday(); render(); return; }
  var editSet = e.target.closest("[data-edit-set]"); if(editSet){ showScreen("training"); startEditSet(+editSet.dataset.editSet); return; }
});

id("mealForm").addEventListener("submit", function(e){
  e.preventDefault();
  var name = cleanText(id("mealName").value,60); if(!name) return;
  addMeal({ name:name, protein:readNumber("mealProtein",0,400,0), calories:readNumber("mealCalories",0,10000,0), carbs:readNumber("mealCarbs",0,1000,0), fat:readNumber("mealFat",0,1000,0) });
  e.target.reset();
});
id("quickForm").addEventListener("submit", function(e){
  e.preventDefault();
  var name = cleanText(id("quickName").value,40); if(!name) return;
  state.quicks.push({ name:name, protein:readNumber("quickProtein",0,400,0), calories:readNumber("quickCalories",0,10000,0), carbs:readNumber("quickCarbs",0,1000,0), fat:readNumber("quickFat",0,1000,0) });
  id("quickDialog").close(); render();
});
id("comboForm").addEventListener("submit", function(e){
  e.preventDefault();
  var name = cleanText(id("comboName").value,40); if(!name) return;
  state.combos.push({ name:name, protein:readNumber("comboProtein",0,400,0), calories:readNumber("comboCalories",0,10000,0), carbs:readNumber("comboCarbs",0,1000,0), fat:readNumber("comboFat",0,1000,0) });
  id("comboDialog").close(); render();
});
id("setForm").addEventListener("submit", function(e){
  e.preventDefault();
  var selected = state.training.selectedExercise;
  if(!selected){ id("setStatus").textContent = "請先選動作。"; return; }
  var entry = cleanSet({ id: Date.now(), exercise:selected, reps:readNumber("repsInput",1,1000,0), sets:readNumber("setsInput",1,100,0), weight:readNumber("setWeightInput",0,500,0), rpe:readNumber("rpeInput",1,10,7), rest:readNumber("restInput",0,1800,90), difficulty:difficulty(selected), zone:state.training.zone, muscle:state.training.muscle, muscleLabel:muscle().label });
  if(state.training.editingSet !== null && state.training.sets[state.training.editingSet]){
    entry.id = state.training.sets[state.training.editingSet].id || entry.id;
    state.training.sets[state.training.editingSet] = entry;
  }else{
    state.training.sets.push(entry);
  }
  state.training.editingSet = null;
  recalcMinutes(); syncToday(); id("setForm").reset(); closeSetDialog(); render();
});
id("profileForm").addEventListener("submit", function(e){
  e.preventDefault();
  state.profile.currentWeight = readNumber("currentWeightInput",1,400,bodyWeight());
  state.profile.targetWeight = readNumber("targetWeightInput",1,400,targetWeight());
  state.profile.height = readNumber("heightInput",50,250,state.profile.height);
  state.profile.proteinGoal = readNumber("proteinGoalInput",1,400,state.profile.proteinGoal);
  state.profile.calorieGoal = readNumber("calorieGoalInput",500,10000,state.profile.calorieGoal);
  recordWeight(); render();
});
id("customForm").addEventListener("submit", function(e){
  e.preventDefault();
  var name = cleanText(id("customExerciseName").value,60); if(!name) return;
  var key = mkey();
  if(!state.training.custom[key]) state.training.custom[key] = [];
  if(state.training.custom[key].indexOf(name) === -1) state.training.custom[key].push(name);
  id("customDialog").close(); render();
});
id("resetBtn").addEventListener("click", function(){
  if(!confirm("確定要清空今天的紀錄嗎？")) return;
  makeSnapshot("清空前");
  state.undoToday = { meals: state.meals.slice(), sets: state.training.sets.slice(), minutes: state.training.minutes };
  state.meals = []; state.training.sets = []; state.training.minutes = 0; state.history[todayKey()] = { sets: [], minutes: 0, protein: 0 };
  render();
});
id("undoReset").addEventListener("click", function(){
  if(!state.undoToday) return alert("目前沒有可復原的清空紀錄。");
  state.meals = state.undoToday.meals || [];
  state.training.sets = state.undoToday.sets || [];
  state.training.minutes = state.undoToday.minutes || 0;
  state.undoToday = null; syncToday(); render();
});
id("exportData").addEventListener("click", function(){
  makeSnapshot("匯出前");
  var blob = new Blob([JSON.stringify(state,null,2)], { type:"application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "core-os-backup-" + todayKey() + ".json";
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
});
id("importData").addEventListener("click", function(){ id("importFile").click(); });
id("importFile").addEventListener("change", function(e){
  var f = e.target.files && e.target.files[0]; if(!f) return;
  var r = new FileReader();
  r.onload = function(){
    try{ makeSnapshot("匯入前"); state = Object.assign(JSON.parse(JSON.stringify(base)), JSON.parse(r.result)); save(); render(); }
    catch(err){ alert("備份檔格式不正確。"); }
  };
  r.readAsText(f); e.target.value = "";
});
["closeQuick","cancelQuick"].forEach(function(x){ id(x).addEventListener("click", function(){ id("quickDialog").close(); }); });
["closeCombo","cancelCombo"].forEach(function(x){ id(x).addEventListener("click", function(){ id("comboDialog").close(); }); });
["closeCustom","cancelCustom"].forEach(function(x){ id(x).addEventListener("click", function(){ id("customDialog").close(); }); });
id("closeMealTool").addEventListener("click", function(){ id("addMealToolDialog").close(); });
id("chooseQuickTool").addEventListener("click", function(){
  id("addMealToolDialog").close();
  id("quickForm").reset();
  id("quickDialog").showModal();
});
id("chooseComboTool").addEventListener("click", function(){
  id("addMealToolDialog").close();
  id("comboForm").reset();
  id("comboDialog").showModal();
});
id("closeSetDialog").addEventListener("click", cancelEdit);
id("cancelEditSet").addEventListener("click", cancelEdit);
id("openCustom").addEventListener("click", function(){ id("customForm").reset(); id("customDialog").showModal(); });
id("restoreExercises").addEventListener("click", function(){ state.training.hidden[mkey()] = []; render(); });
id("weightYearSelect").addEventListener("change", function(e){ state.profile.weightYear = Number(e.target.value) || new Date().getFullYear(); renderWeightChart(); save(); });
id("restoreSnapshot").addEventListener("click", restoreSnapshot);

function bg(){
  var c = id("bg"), x = c.getContext("2d"), d = Math.max(1, devicePixelRatio || 1), pts = [];
  function resize(){ c.width = innerWidth*d; c.height = innerHeight*d; pts = []; for(var i=0;i<26;i++) pts.push({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.18*d,vy:(Math.random()-.5)*.18*d}); }
  function tick(){
    x.clearRect(0,0,c.width,c.height); x.strokeStyle = "rgba(96,226,232,.11)"; x.fillStyle = "rgba(96,226,232,.45)";
    pts.forEach(function(p){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>c.width)p.vx*=-1; if(p.y<0||p.y>c.height)p.vy*=-1; x.beginPath(); x.arc(p.x,p.y,1.7*d,0,Math.PI*2); x.fill(); });
    requestAnimationFrame(tick);
  }
  resize(); addEventListener("resize", resize); tick();
}

function setupLiquidMotion(){
  var targetTilt = 0, targetShift = 0, currentTilt = 0, currentShift = 0, tiltVel = 0, shiftVel = 0, lastInput = 0, start = performance.now();
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function setTarget(tilt, shift){
    targetTilt = clamp(tilt, -6.5, 6.5);
    targetShift = clamp(shift, -5.5, 5.5);
    lastInput = performance.now();
  }
  function paint(){
    var t = (performance.now() - start) / 1000;
    if(performance.now() - lastInput > 900){
      targetTilt = Math.sin(t * .9) * 1.1;
      targetShift = Math.sin(t * .8 + .7) * 1.4;
    }
    tiltVel = (tiltVel + (targetTilt - currentTilt) * .035) * .86;
    shiftVel = (shiftVel + (targetShift - currentShift) * .045) * .84;
    currentTilt += tiltVel;
    currentShift += shiftVel;
    document.querySelectorAll(".liquid-orb").forEach(function(orb){
      orb.style.setProperty("--liquid-tilt", currentTilt.toFixed(2) + "deg");
      orb.style.setProperty("--liquid-shift", currentShift.toFixed(2) + "px");
    });
    requestAnimationFrame(paint);
  }
  function listenMotion(){
    window.addEventListener("deviceorientation", function(e){
      if(typeof e.gamma !== "number") return;
      setTarget(e.gamma * .18, e.gamma * .12);
    }, true);
    window.addEventListener("devicemotion", function(e){
      var a = e.accelerationIncludingGravity;
      if(!a || typeof a.x !== "number") return;
      setTarget(a.x * .38, a.x * .28);
    }, true);
  }
  function requestMotion(){
    var asks = [];
    if(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") asks.push(DeviceOrientationEvent.requestPermission());
    if(window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") asks.push(DeviceMotionEvent.requestPermission());
    if(asks.length){
      Promise.allSettled(asks).then(function(){ listenMotion(); });
    }else{
      listenMotion();
    }
  }
  window.addEventListener("touchmove", function(e){
    var p = e.touches && e.touches[0];
    if(!p) return;
    var x = (p.clientX / Math.max(1, innerWidth)) - .5;
    setTarget(x * 7, x * 5);
  }, { passive:true });
  window.addEventListener("pointermove", function(e){
    if(e.pointerType && e.pointerType !== "mouse") return;
    if(e.buttons !== 1) return;
    var x = (e.clientX / Math.max(1, innerWidth)) - .5;
    setTarget(x * 5, x * 4);
  }, { passive:true });
  ["pointerdown","touchstart","click"].forEach(function(type){
    window.addEventListener(type, requestMotion, { once:true, passive:true });
  });
  requestMotion();
  paint();
}

render();
bg();
setupLiquidMotion();
