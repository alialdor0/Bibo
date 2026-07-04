export const STORY_LINES = {
  spy: [
    { text:'Today, I received a strange message. It said: Come alone.', ar:'اليوم استلمت رسالة غريبة. قالت: تعال وحدك.', words:[{id:1,word:'received',emoji:'📩',ar:'استلمت',phonetic:'/rɪˈsiːvd/',pron:'ريسيفد',grammar:'Past tense verb'},{id:2,word:'strange',emoji:'❓',ar:'غريب',phonetic:'/streɪndʒ/',pron:'سترينج',grammar:'Adjective'},{id:3,word:'message',emoji:'✉️',ar:'رسالة',phonetic:'/ˈmes.ɪdʒ/',pron:'ميسيج',grammar:'Noun'},{id:4,word:'alone',emoji:'🚶',ar:'وحدك',phonetic:'/əˈloʊn/',pron:'ألون',grammar:'Adjective'}] },
    { text:'I looked around. There was a man watching me. His eyes were cold.', ar:'نظرت حولي. كان هناك رجل يراقبني. عيونه جامدة.', words:[{id:5,word:'looked',emoji:'👀',ar:'نظرت',phonetic:'/lʊkt/',pron:'لوكت',grammar:'Past tense'},{id:6,word:'watching',emoji:'🔍',ar:'يراقب',phonetic:'/ˈwɒtʃ.ɪŋ/',pron:'واتشينج',grammar:'Continuous'},{id:7,word:'cold',emoji:'🧊',ar:'بارد',phonetic:'/koʊld/',pron:'كولد',grammar:'Adjective'}] },
    { text:'He walked toward me slowly. He stopped and handed me an envelope.', ar:'مشى نحوي ببطء. توقف وناولني مغلفاً.', words:[{id:8,word:'walked',emoji:'🚶',ar:'مشى',phonetic:'/wɔːkt/',pron:'ووكت',grammar:'Past tense'},{id:9,word:'slowly',emoji:'🐢',ar:'ببطء',phonetic:'/ˈsloʊ.li/',pron:'سلولي',grammar:'Adverb'},{id:10,word:'envelope',emoji:'✉️',ar:'مغلف',phonetic:'/ˈen.və.loʊp/',pron:'إنفيلوب',grammar:'Noun'}] },
    { text:'Inside was a photo of a building. An address written in red ink. One word: Tonight.', ar:'بداخله صورة لمبنى. عنوان بالحبر الأحمر. كلمة: الليلة.', words:[{id:11,word:'photo',emoji:'📸',ar:'صورة',phonetic:'/ˈfoʊ.toʊ/',pron:'فوتو',grammar:'Noun'},{id:12,word:'address',emoji:'📍',ar:'عنوان',phonetic:'/ˈæd.res/',pron:'أدريس',grammar:'Noun'},{id:13,word:'tonight',emoji:'🌙',ar:'الليلة',phonetic:'/təˈnaɪt/',pron:'تونايت',grammar:'Adverb'}] },
    { text:'I thought of my family. But the mission was important. I walked to the door.', ar:'فكرت بعائلتي. لكن المهمة مهمة. مشيت نحو الباب.', words:[{id:14,word:'thought',emoji:'💭',ar:'فكرت',phonetic:'/θɔːt/',pron:'ثوت',grammar:'Past tense'},{id:15,word:'mission',emoji:'🎯',ar:'مهمة',phonetic:'/ˈmɪʃ.ən/',pron:'ميشن',grammar:'Noun'},{id:16,word:'important',emoji:'❗',ar:'مهم',phonetic:'/ɪmˈpɔːr.tənt/',pron:'إمبورتنت',grammar:'Adjective'}] },
  ],
  medical: [
    { text:'Dr. Ali rushed into the emergency room. A patient needed help immediately.', ar:'دخل الدكتور علي غرفة الطوارئ. مريض يحتاج مساعدة فورية.', words:[{id:1,word:'rushed',emoji:'🏃',ar:'اندفع',phonetic:'/rʌʃt/',pron:'راشت',grammar:'Past tense'},{id:2,word:'emergency',emoji:'🚨',ar:'طوارئ',phonetic:'/ɪˈmɜːr.dʒən.si/',pron:'إيمرجنسي',grammar:'Noun'},{id:3,word:'immediately',emoji:'⚡',ar:'فوراً',phonetic:'/ɪˈmiː.di.ət.li/',pron:'إيميدياتلي',grammar:'Adverb'}] },
    { text:'He checked the patient quickly. The situation was serious and dangerous.', ar:'فحص المريض بسرعة. الوضع كان خطيراً وجاداً.', words:[{id:4,word:'checked',emoji:'✅',ar:'فحص',phonetic:'/tʃekt/',pron:'تشيكت',grammar:'Past tense'},{id:5,word:'serious',emoji:'😐',ar:'خطير',phonetic:'/ˈsɪər.i.əs/',pron:'سيريوس',grammar:'Adjective'},{id:6,word:'dangerous',emoji:'⚠️',ar:'خطر',phonetic:'/ˈdeɪn.dʒər.əs/',pron:'دينجرس',grammar:'Adjective'}] },
  ],
};

export const COOP_STORY = {
  spy:     [{hero:'Ahmed entered the building.',partner:'His partner Khalid was already waiting.'},{hero:'Ahmed said: Did you bring the files?',partner:'Khalid nodded and opened his bag.'},{hero:'Ahmed received a strange envelope.',partner:'Khalid watched him open it.'},{hero:'Ahmed read the message in silence.',partner:'Khalid stood near the door.'},{hero:'Ahmed said: The mission is dangerous.',partner:'Khalid answered: I know. But important.'}],
  medical: [{hero:'Dr. Ali rushed into the emergency room.',partner:'Nurse Sara handed him the patient file.'},{hero:'He checked the patient quickly.',partner:'Sara connected the monitor.'},{hero:'Ali said: We need to act fast.',partner:'Sara prepared the equipment.'},{hero:'Ali gave the first injection.',partner:'Sara watched the vital signs.'},{hero:'Ali said: The patient is stable.',partner:'Sara smiled with relief.'}],
  love:    [{hero:'Rami walked into the garden slowly.',partner:'Layla was reading under the tree.'},{hero:'He called her name softly.',partner:'She looked up and smiled.'},{hero:'Rami said: I have something to tell you.',partner:'Layla closed her book gently.'},{hero:'He handed her a small letter.',partner:'She opened it with trembling hands.'},{hero:'Rami waited for her answer.',partner:'Layla whispered: Yes.'}],
  crime:   [{hero:'Detective Omar entered the courtroom.',partner:'His partner Nour reviewed the evidence.'},{hero:'Omar spoke clearly to the judge.',partner:'Nour showed the files to the jury.'},{hero:'Omar said: The evidence is clear.',partner:'Nour pointed to the key document.'},{hero:'Omar presented the final witness.',partner:'Nour watched the suspect carefully.'},{hero:'Omar said: We have the truth.',partner:'Nour nodded with confidence.'}],
  family:  [{hero:'Kareem arrived home after a long day.',partner:'His mother welcomed him warmly.'},{hero:'He sat at the dinner table quietly.',partner:'She placed his favorite food before him.'},{hero:'Kareem said: I have important news.',partner:'She sat down and listened carefully.'},{hero:'He told her about his new opportunity.',partner:'She held his hand and smiled.'},{hero:'Kareem said: I could not do it without you.',partner:'She said: I am always proud of you.'}],
};

export const COOP_WORDS = {
  spy:     [['entered','building'],['Did','bring','files'],['received','envelope'],['read','silence'],['mission','dangerous']],
  medical: [['rushed','emergency'],['checked','quickly'],['need','act','fast'],['gave','injection'],['patient','stable']],
  love:    [['walked','garden'],['called','softly'],['something','tell'],['handed','letter'],['waited','answer']],
  crime:   [['entered','courtroom'],['spoke','clearly'],['evidence','clear'],['presented','witness'],['have','truth']],
  family:  [['arrived','home'],['sat','quietly'],['important','news'],['told','opportunity'],['could','without']],
};

export const RESCUE_WORDS = [
  {id:1, en:'tonight',  ar:'الليلة',  emoji:'🌙', daysLeft:0, phonetic:'تونايت'},
  {id:2, en:'corner',   ar:'زاوية',   emoji:'📐', daysLeft:0, phonetic:'كورنر'},
  {id:3, en:'thought',  ar:'فكرت',    emoji:'💭', daysLeft:0, phonetic:'ثوت'},
  {id:4, en:'address',  ar:'عنوان',   emoji:'📍', daysLeft:1, phonetic:'أدريس'},
  {id:5, en:'careful',  ar:'حذر',     emoji:'🛡️', daysLeft:1, phonetic:'كيرفل'},
  {id:6, en:'mission',  ar:'مهمة',    emoji:'🎯', daysLeft:2, phonetic:'ميشن'},
  {id:7, en:'dangerous',ar:'خطير',    emoji:'⚠️', daysLeft:2, phonetic:'دينجرس'},
  {id:8, en:'answer',   ar:'يرد',     emoji:'📲', daysLeft:3, phonetic:'أنسر'},
  {id:9, en:'depends',  ar:'يعتمد',   emoji:'⚖️', daysLeft:3, phonetic:'ديبندز'},
];

export const DICT_WORDS = [
  {id:1, en:'message',  ar:'رسالة',  emoji:'✉️', status:'learned'},
  {id:2, en:'building', ar:'مبنى',   emoji:'🏢', status:'learned'},
  {id:3, en:'envelope', ar:'مغلف',   emoji:'📩', status:'learned'},
  {id:4, en:'address',  ar:'عنوان',  emoji:'📍', status:'review'},
  {id:5, en:'arrived',  ar:'وصلت',   emoji:'🚪', status:'learned'},
  {id:6, en:'slowly',   ar:'ببطء',   emoji:'🐢', status:'learned'},
  {id:7, en:'dangerous',ar:'خطير',   emoji:'⚠️', status:'review'},
  {id:8, en:'mission',  ar:'مهمة',   emoji:'🎯', status:'review'},
  {id:9, en:'serious',  ar:'جاد',    emoji:'😐', status:'learned'},
  {id:10,en:'walked',   ar:'مشى',    emoji:'🚶', status:'learned'},
  {id:11,en:'received', ar:'استلمت', emoji:'📬', status:'learned'},
  {id:12,en:'strange',  ar:'غريب',   emoji:'❓', status:'learned'},
  {id:13,en:'tonight',  ar:'الليلة', emoji:'🌙', status:'forgotten'},
  {id:14,en:'careful',  ar:'حذر',    emoji:'🛡️', status:'review'},
  {id:15,en:'waited',   ar:'انتظر',  emoji:'⏳', status:'learned'},
  {id:16,en:'corner',   ar:'زاوية',  emoji:'📐', status:'forgotten'},
  {id:17,en:'thought',  ar:'فكرت',   emoji:'💭', status:'forgotten'},
  {id:18,en:'country',  ar:'بلد',    emoji:'🏳️', status:'learned'},
  {id:19,en:'important',ar:'مهم',    emoji:'❗', status:'learned'},
  {id:20,en:'silence',  ar:'صمت',    emoji:'🤫', status:'learned'},
];

export const LEADERBOARD = {
  weekly: [
    {rank:1, name:'Sara Al-Omari',    city:'Riyadh',    words:124, streak:7,  track:'❤️'},
    {rank:2, name:'Ahmed Al-Kawari',  city:'Doha',      words:118, streak:12, track:'🏥'},
    {rank:3, name:'Mona Al-Harbi',    city:'Jeddah',    words:105, streak:5,  track:'⚖️'},
    {rank:4, name:'Khalid Al-Shamri', city:'Kuwait',    words:97,  streak:9,  track:'🕵️'},
    {rank:5, name:'Reem Al-Salem',    city:'Muscat',    words:89,  streak:4,  track:'👨‍👩‍👧'},
    {rank:6, name:'Ali Al-Husseini',  city:'Baghdad',   words:48,  streak:3,  track:'🕵️', isMe:true},
    {rank:7, name:'Noura Al-Qahtani', city:'Abu Dhabi', words:45,  streak:2,  track:'❤️'},
  ],
  alltime: [
    {rank:1, name:'Ahmed Al-Kawari',  city:'Doha',      words:1840, streak:90, track:'🏥'},
    {rank:2, name:'Sara Al-Omari',    city:'Riyadh',    words:1620, streak:75, track:'❤️'},
    {rank:3, name:'Mona Al-Harbi',    city:'Jeddah',    words:1340, streak:60, track:'⚖️'},
    {rank:4, name:'Khalid Al-Shamri', city:'Kuwait',    words:1180, streak:45, track:'🕵️'},
    {rank:5, name:'Ali Al-Husseini',  city:'Baghdad',   words:48,   streak:3,  track:'🕵️', isMe:true},
  ],
};

export const FRIENDS = [
  {id:1, name:'Sara Al-Omari',    city:'Riyadh',    track:'❤️', level:'Advanced Narrator',    online:true},
  {id:2, name:'Ahmed Al-Kawari',  city:'Doha',      track:'🏥', level:'Expert Storyteller',   online:true},
  {id:3, name:'Khalid Al-Shamri', city:'Kuwait',    track:'🕵️', level:'Skilled Communicator', online:false},
  {id:4, name:'Mona Al-Harbi',    city:'Jeddah',    track:'⚖️', level:'Rising Speaker',       online:false},
];
