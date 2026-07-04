export const GENDERS = [['Male','ذكر'],['Female','أنثى']];

export const JOBS = [
  { en:'Student',            prefix:'',      ar:'طالب' },
  { en:'Doctor',             prefix:'Dr.',   ar:'طبيب' },
  { en:'Engineer',           prefix:'Eng.',  ar:'مهندس' },
  { en:'Architect',          prefix:'Arch.', ar:'معماري' },
  { en:'Lawyer',             prefix:'Atty.', ar:'محامي' },
  { en:'Teacher',            prefix:'',      ar:'معلم' },
  { en:'Professor',          prefix:'Prof.', ar:'أستاذ' },
  { en:'Pharmacist',         prefix:'',      ar:'صيدلاني' },
  { en:'Accountant',         prefix:'',      ar:'محاسب' },
  { en:'Programmer',         prefix:'',      ar:'مبرمج' },
  { en:'Designer',           prefix:'',      ar:'مصمم' },
  { en:'Business Owner',     prefix:'',      ar:'صاحب عمل' },
  { en:'Government Employee',prefix:'',      ar:'موظف حكومي' },
  { en:'Freelancer',         prefix:'',      ar:'مستقل' },
  { en:'Other',              prefix:'',      ar:'أخرى' },
];

export const HOBBIES = [
  ['Reading','القراءة'],['Writing','الكتابة'],['Drawing','الرسم'],
  ['Music','الموسيقى'],['Sports','الرياضة'],['Cooking','الطبخ'],
  ['Travel','السفر'],['Gaming','الألعاب'],['Photography','التصوير'],
  ['Other','أخرى'],
];

export const AGES = Array.from({length:83}, (_,i) => String(i + 13));

export const LEVEL_TITLES = [
  { min:0, max:1, en:'Novice Writer',       ar:'كاتب مبتدئ',    color:'#8B4513' },
  { min:2, max:2, en:'Rising Speaker',       ar:'متحدث صاعد',    color:'#1B3A6B' },
  { min:3, max:3, en:'Skilled Communicator', ar:'متواصل ماهر',   color:'#2E8B57' },
  { min:4, max:4, en:'Advanced Narrator',    ar:'راوٍ متقدم',    color:'#C0C0C0' },
  { min:5, max:5, en:'Expert Storyteller',   ar:'حكواتي خبير',   color:'#FFB300' },
];

export const ASSESSMENT_QUESTIONS = [
  { q:'What does "received" mean?', opts:['استلمت','ذهبت','قرأت','كتبت'], correct:0, difficulty:1 },
  { q:'Choose the correct sentence:', opts:['He walk to the store','He walked to the store','He walking to the store','He walks to store'], correct:1, difficulty:2 },
  { q:'What is the past tense of "speak"?', opts:['speaked','spoken','spoke','speaking'], correct:2, difficulty:3 },
  { q:'Fill in: "The message was written ___ red ink."', opts:['on','in','at','with'], correct:1, difficulty:4 },
  { q:'Which uses "despite" correctly?', opts:['Despite it was raining, we went out.','Despite of the rain, we went out.','Despite the rain, we went out.','Despite that rain, we went out.'], correct:2, difficulty:5 },
];

export const TRACKS = [
  { id:'spy',     icon:'🕵️', name:'Spy & Mystery',    nameAr:'التجسس والغموض',    color:'#C0C0C0', bg:'rgba(192,192,192,0.08)', desc:'A secret mission awaits.',           preview:'"Today, I received a strange message."', cinematic:'Dark corridors · Hidden files',    sounds:['📻 Radio static','👣 Footsteps','🔫 Tension click','🚨 Alert siren'] },
  { id:'love',    icon:'❤️', name:'Love Story',        nameAr:'قصة حب',             color:'#c0392b', bg:'rgba(139,0,0,0.10)',     desc:'Your heart leads the story.',        preview:'"She looked at me. I could not speak."', cinematic:'Sunset walks · Love letters',    sounds:['💌 Message chime','💓 Heartbeat','🎹 Piano key','🕊️ Dove wings'] },
  { id:'family',  icon:'👨‍👩‍👧', name:'Family',       nameAr:'الأسرة',              color:'#8B4513', bg:'rgba(139,69,19,0.10)',   desc:'Family bonds are stronger.',         preview:'"My mother called. Her voice was warm."', cinematic:'Family dinners · Home warmth', sounds:['😄 Children laughing','🚪 Door opening','🍽️ Kitchen','📞 Phone ring'] },
  { id:'crime',   icon:'⚖️', name:'Crime & Justice',   nameAr:'الجريمة والعدالة',   color:'#4a90d9', bg:'rgba(27,58,107,0.12)',   desc:'The truth is hidden.',               preview:'"The judge looked at the file."',          cinematic:'Courtroom · Investigation',     sounds:['⚖️ Gavel','🔗 Handcuffs','🚔 Police siren','📁 File stamp'] },
  { id:'medical', icon:'🏥', name:'Medical',            nameAr:'الطب والإنقاذ',      color:'#2E8B57', bg:'rgba(46,139,87,0.10)',   desc:'Every second counts.',               preview:'"The doctor entered quickly."',          cinematic:'Emergency · Life-saving',       sounds:['🚑 Ambulance','💓 Heart monitor','⚡ Defibrillator','🩺 Stethoscope'] },
];

export const TRACK_SOUNDS = {
  spy:     { ambient:'🎵 Suspense background', sounds:[{icon:'📻',label:'Radio static',trigger:'mission start'},{icon:'👣',label:'Footsteps',trigger:'hero moves'},{icon:'🔫',label:'Tension click',trigger:'danger moment'},{icon:'🚨',label:'Alert siren',trigger:'mission alert'},{icon:'🎯',label:'Target beep',trigger:'correct answer'}] },
  love:    { ambient:'🎵 Soft romantic piano',  sounds:[{icon:'💌',label:'Message chime',trigger:'letter arrives'},{icon:'💓',label:'Heartbeat',trigger:'emotional moment'},{icon:'🎹',label:'Piano key',trigger:'correct answer'},{icon:'🕊️',label:'Dove wings',trigger:'reunion scene'}] },
  family:  { ambient:'🎵 Warm acoustic guitar', sounds:[{icon:'😄',label:'Children laughing',trigger:'happy moment'},{icon:'🚪',label:'Door opening',trigger:'arrival scene'},{icon:'🍽️',label:'Kitchen sounds',trigger:'home scene'},{icon:'👏',label:'Applause',trigger:'correct answer'}] },
  crime:   { ambient:'🎵 Dark courtroom music', sounds:[{icon:'⚖️',label:'Gavel strike',trigger:'verdict moment'},{icon:'🔗',label:'Handcuffs',trigger:'arrest scene'},{icon:'🚔',label:'Police siren',trigger:'chase scene'},{icon:'🔔',label:'Court bell',trigger:'correct answer'}] },
  medical: { ambient:'🎵 Hospital ambient hum', sounds:[{icon:'🚑',label:'Ambulance siren',trigger:'emergency'},{icon:'💓',label:'Heart monitor',trigger:'patient stable'},{icon:'⚡',label:'Defibrillator',trigger:'critical moment'},{icon:'✅',label:'Heartbeat restored',trigger:'correct answer'}] },
};

export const getLevel = (score) => LEVEL_TITLES.find(l => score >= l.min && score <= l.max) || LEVEL_TITLES[0];
export const getPrefix = (jobEn) => { const j = JOBS.find(x => x.en === jobEn); return j ? j.prefix : ''; };
