// ═══════════════════════════════════════
// BIBO LINGO — All App Data
// ═══════════════════════════════════════

// ── اللغة ──
export const i18n = {
  ar: {
    appTagline:    'بيبو سيجعلك تغرّد باللغة الإنجليزية',
    welcome:       'أهلاً وسهلاً',
    loginDesc:     'سجّل دخولك لحفظ تقدمك وقصتك',
    withApple:     'الدخول بحساب Apple',
    withGoogle:    'الدخول بحساب Google',
    asGuest:       'الدخول كضيف',
    guestNote:     'الضيف لا يحفظ تقدمه بين الجلسات',
    heroDesc:      'أنت البطل. قصتك تُبنى بكلماتك.',
    startStory:    'ابدأ قصتك',
    next:          'التالي',
    back:          'رجوع',
    start:         'ابدأ',
    enterStory:    'ادخل إلى القصة',
    scrollHint:    'مرّر للاختيار',
    qName:         'ما اسمك بالإنجليزية؟',
    qGender:       'ما جنسك؟',
    qCountry:      'من أي دولة أنت؟',
    qCity:         'من أي مدينة؟',
    qJob:          'ما مهنتك؟',
    qAge:          'ما تاريخ ميلادك؟',
    qLevel:        'اختبار تحديد المستوى',
    levelNote:     'أجب بصدق — هذا يحدد مستواك في القصة',
    firstName:     'الاسم الأول',
    lastName:      'اسم العائلة',
    orType:        'أو اكتب يدوياً:',
    ready:         'بطاقتك جاهزة!',
    leave:         'مغادرة',
    leaveMsg:      'ستفقد تقدمك في هذا الدرس إذا غادرت الآن.',
    stayBtn:       'ابق',
    leaveBtn:      'غادر',
    home:          'الرئيسية',
    library:       'المكتبة',
    challenge:     'التحدي',
    profile:       'ملفي',
    settings:      'الإعدادات',
    store:         'المتجر',
    gems:          'جوهرة',
    buyBtn:        'شراء',
    owned:         'تمتلكه',
    inkLeft:       'حبر متبقٍ',
    eraserLeft:    'ممحاة متبقية',
    pagesLeft:     'صفحات متبقية',
    openGift:      'افتح هديتك',
    giftDesc:      'دوس على الصندوق واحصل على مكافأة مفاجئة',
    language:      'اللغة',
    darkMode:      'الوضع الليلي',
    offline:       'وضع أوف لاين',
    notifications: 'الإشعارات',
    sound:         'الصوت',
    inputMode:     'نمط الإدخال',
    dailyReview:   'كلمات المراجعة اليومية',
    fontSize:      'حجم الخط',
    editProfile:   'تعديل الملف الشخصي',
    changeTrack:   'تغيير المسار',
    retakeTest:    'إعادة اختبار المستوى',
    signOut:       'تسجيل الخروج',
    currentChapter:'الفصل الحالي',
    resumeLesson:  'متابعة الدرس',
    wordsLearned:  'كلمة تعلمتها',
    forReview:     'للمراجعة',
    episodes:      'حلقات',
    points:        'نقاط',
  },
  en: {
    appTagline:    'Bibo will make you sing in English',
    welcome:       'Welcome',
    loginDesc:     'Sign in to save your progress and story',
    withApple:     'Continue with Apple',
    withGoogle:    'Continue with Google',
    asGuest:       'Continue as Guest',
    guestNote:     'Guest progress is not saved between sessions',
    heroDesc:      'You are the hero. Your story is built with your words.',
    startStory:    'Start your story',
    next:          'Next',
    back:          'Back',
    start:         'Start',
    enterStory:    'Enter the story',
    scrollHint:    'Scroll to select',
    qName:         'What is your name in English?',
    qGender:       'What is your gender?',
    qCountry:      'Which country are you from?',
    qCity:         'Which city?',
    qJob:          'What is your profession?',
    qAge:          'What is your date of birth?',
    qLevel:        'Level Assessment Test',
    levelNote:     'Answer honestly — this sets your story level',
    firstName:     'First name',
    lastName:      'Last name',
    orType:        'Or type manually:',
    ready:         'Your ID Card is ready!',
    leave:         'Leave',
    leaveMsg:      'Your progress will be lost if you leave now.',
    stayBtn:       'Stay',
    leaveBtn:      'Leave',
    home:          'Home',
    library:       'Library',
    challenge:     'Challenge',
    profile:       'Profile',
    settings:      'Settings',
    store:         'Store',
    gems:          'Gem',
    buyBtn:        'Buy',
    owned:         'Owned',
    inkLeft:       'ink left',
    eraserLeft:    'eraser left',
    pagesLeft:     'pages left',
    openGift:      'Open your gift',
    giftDesc:      'Tap the box for a surprise reward',
    language:      'Language',
    darkMode:      'Dark Mode',
    offline:       'Offline Mode',
    notifications: 'Notifications',
    sound:         'Sound',
    inputMode:     'Input Mode',
    dailyReview:   'Daily Review Words',
    fontSize:      'Font Size',
    editProfile:   'Edit Profile',
    changeTrack:   'Change Track',
    retakeTest:    'Retake Level Test',
    signOut:       'Sign Out',
    currentChapter:'Current Chapter',
    resumeLesson:  'Resume Lesson',
    wordsLearned:  'Words Learned',
    forReview:     'For Review',
    episodes:      'Episodes',
    points:        'Points',
  },
};

export const t = (key, lang) => (i18n[lang || 'ar'] || i18n.ar)[key] || key;

// ── الجنس ──
export const GENDERS = { ar: [['Male','ذكر'],['Female','أنثى']], en: [['Male','Male'],['Female','Female']] };

// ── الدول ──
export const COUNTRIES = [
  ['Iraq','العراق'],['Saudi Arabia','السعودية'],['Egypt','مصر'],
  ['Jordan','الأردن'],['Syria','سوريا'],['Lebanon','لبنان'],
  ['Palestine','فلسطين'],['UAE','الإمارات'],['Kuwait','الكويت'],
  ['Qatar','قطر'],['Bahrain','البحرين'],['Oman','عُمان'],
  ['Yemen','اليمن'],['Libya','ليبيا'],['Tunisia','تونس'],
  ['Algeria','الجزائر'],['Morocco','المغرب'],['Sudan','السودان'],
  ['Other','أخرى'],
];

// ── المدن ──
export const CITIES = {
  'Iraq':         [['Baghdad','بغداد'],['Basra','البصرة'],['Mosul','الموصل'],['Erbil','أربيل'],['Najaf','النجف'],['Karbala','كربلاء'],['Kirkuk','كركوك'],['Sulaymaniyah','السليمانية'],['Anbar','الأنبار'],['Diyala','ديالى'],['Babil','بابل'],['Wasit','واسط'],['Dhi Qar','ذي قار'],['Maysan','ميسان'],['Muthanna','المثنى'],['Qadisiyyah','القادسية'],['Saladin','صلاح الدين'],['Nineveh','نينوى'],['Dohuk','دهوك'],['Halabja','حلبجة']],
  'Saudi Arabia': [['Riyadh','الرياض'],['Jeddah','جدة'],['Mecca','مكة المكرمة'],['Medina','المدينة المنورة'],['Dammam','الدمام'],['Khobar','الخبر'],['Tabuk','تبوك'],['Abha','أبها'],['Taif','الطائف'],['Buraidah','بريدة'],['Hail','حائل'],['Najran','نجران'],['Jizan','جيزان'],['Yanbu','ينبع'],['Al Ahsa','الأحساء']],
  'Egypt':        [['Cairo','القاهرة'],['Alexandria','الإسكندرية'],['Giza','الجيزة'],['Luxor','الأقصر'],['Aswan','أسوان'],['Port Said','بورسعيد'],['Suez','السويس'],['Mansoura','المنصورة'],['Tanta','طنطا'],['Asyut','أسيوط'],['Minya','المنيا'],['Sharm el-Sheikh','شرم الشيخ'],['Hurghada','الغردقة']],
  'Jordan':       [['Amman','عمان'],['Zarqa','الزرقاء'],['Irbid','إربد'],['Aqaba','العقبة'],['Salt','السلط'],['Madaba','مادبا'],['Jerash','جرش'],['Ajloun','عجلون'],['Mafraq','المفرق'],['Karak','الكرك']],
  'UAE':          [['Dubai','دبي'],['Abu Dhabi','أبوظبي'],['Sharjah','الشارقة'],['Ajman','عجمان'],['Ras Al Khaimah','رأس الخيمة'],['Fujairah','الفجيرة'],['Al Ain','العين']],
  'Syria':        [['Damascus','دمشق'],['Aleppo','حلب'],['Homs','حمص'],['Latakia','اللاذقية'],['Hama','حماة'],['Deir ez-Zor','دير الزور'],['Tartus','طرطوس'],['Idlib','إدلب']],
  'Lebanon':      [['Beirut','بيروت'],['Tripoli','طرابلس'],['Sidon','صيدا'],['Tyre','صور'],['Zahle','زحلة'],['Baalbek','بعلبك']],
  'Kuwait':       [['Kuwait City','مدينة الكويت'],['Hawalli','حولي'],['Salmiya','السالمية'],['Farwaniya','الفروانية'],['Ahmadi','الأحمدي'],['Jahra','الجهراء']],
  'Qatar':        [['Doha','الدوحة'],['Al Rayyan','الريان'],['Al Wakrah','الوكرة'],['Al Khor','الخور'],['Mesaieed','مسيعيد']],
  'Bahrain':      [['Manama','المنامة'],['Muharraq','المحرق'],['Riffa','الرفاع'],['Isa Town','مدينة عيسى'],['Hamad Town','مدينة حمد']],
  'Oman':         [['Muscat','مسقط'],['Salalah','صلالة'],['Sohar','صحار'],['Nizwa','نزوى'],['Sur','صور'],['Ibri','عبري']],
  'Yemen':        [['Sanaa','صنعاء'],['Aden','عدن'],['Taiz','تعز'],['Hodeidah','الحديدة'],['Ibb','إب'],['Mukalla','المكلا'],['Dhamar','ذمار'],['Marib','مأرب']],
  'Libya':        [['Tripoli','طرابلس'],['Benghazi','بنغازي'],['Misrata','مصراتة'],['Tobruk','طبرق'],['Derna','درنة'],['Sirte','سرت']],
  'Tunisia':      [['Tunis','تونس'],['Sfax','صفاقس'],['Sousse','سوسة'],['Kairouan','القيروان'],['Bizerte','بنزرت'],['Gabes','قابس'],['Monastir','المنستير']],
  'Algeria':      [['Algiers','الجزائر'],['Oran','وهران'],['Constantine','قسنطينة'],['Annaba','عنابة'],['Batna','باتنة'],['Setif','سطيف'],['Blida','البليدة']],
  'Morocco':      [['Casablanca','الدار البيضاء'],['Rabat','الرباط'],['Fez','فاس'],['Marrakech','مراكش'],['Agadir','أكادير'],['Tangier','طنجة'],['Meknes','مكناس']],
  'Sudan':        [['Khartoum','الخرطوم'],['Omdurman','أم درمان'],['Port Sudan','بورتسودان'],['Kassala','كسلا'],['Nyala','نيالا'],['El Fasher','الفاشر']],
  'Palestine':    [['Gaza','غزة'],['Ramallah','رام الله'],['Hebron','الخليل'],['Nablus','نابلس'],['Jenin','جنين'],['Bethlehem','بيت لحم'],['Jericho','أريحا']],
  'Other':        [['Other','أخرى']],
};

// ── المهن ──
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

// ── الأعمار ──
export const AGES = Array.from({ length: 83 }, (_, i) => String(i + 13));

// ── مستويات اللغة ──
export const LEVEL_TITLES = [
  { min:0, max:2,  en:'Novice Writer',       ar:'كاتب مبتدئ',    color:'#8B4513' },
  { min:3, max:4,  en:'Rising Speaker',       ar:'متحدث صاعد',    color:'#1B3A6B' },
  { min:5, max:6,  en:'Skilled Communicator', ar:'متواصل ماهر',   color:'#2E8B57' },
  { min:7, max:8,  en:'Advanced Narrator',    ar:'راوٍ متقدم',    color:'#C0C0C0' },
  { min:9, max:10, en:'Expert Storyteller',   ar:'حكواتي خبير',   color:'#FFB300' },
];

// ── أسئلة اختبار المستوى: 10 أسئلة (4 مبتدئ + 3 متوسط + 3 متقدم) ──
export const ASSESSMENT = [
  // مبتدئ (4)
  { level:'beginner',     q:'What does "received" mean?',              opts:['استلمت','ذهبت','قرأت','كتبت'],                                                                                               correct:0 },
  { level:'beginner',     q:'Past tense of "speak"?',                  opts:['speaked','spoken','spoke','speaking'],                                                                                        correct:2 },
  { level:'beginner',     q:'What does "address" mean?',               opts:['عنوان','رسالة','مهمة','صورة'],                                                                                                correct:0 },
  { level:'beginner',     q:'One book, two ___.',                      opts:['book','books','bookes','booking'],                                                                                            correct:1 },
  // متوسط (3)
  { level:'intermediate', q:'Choose the correct sentence:',            opts:['He walk to the store','He walked to the store','He walking to the store','He walks to store'],                               correct:1 },
  { level:'intermediate', q:'"The message was written ___ red ink."',  opts:['on','in','at','with'],                                                                                                        correct:1 },
  { level:'intermediate', q:'Select the correctly formed question:',   opts:['Where you are going?','Where are you going?','Where do you going?','Where you going?'],                                      correct:1 },
  // متقدم (3)
  { level:'advanced',     q:'Which uses "despite" correctly?',         opts:['Despite it was raining, we went out.','Despite of the rain, we went out.','Despite the rain, we went out.','Despite that rain, we went out.'], correct:2 },
  { level:'advanced',     q:'Which sentence uses the present perfect correctly?', opts:['I have seen him yesterday.','I saw him yesterday.','I have seen him already.','I seen him already.'],             correct:2 },
  { level:'advanced',     q:'"If I ___ known, I would have called you."', opts:['know','knew','had known','have known'],                                                                                    correct:2 },
];

// ── الأشهر (للاختيار عند اختيار تاريخ الميلاد) ──
export const MONTHS = [
  ['January','يناير'], ['February','فبراير'], ['March','مارس'], ['April','أبريل'],
  ['May','مايو'], ['June','يونيو'], ['July','يوليو'], ['August','أغسطس'],
  ['September','سبتمبر'], ['October','أكتوبر'], ['November','نوفمبر'], ['December','ديسمبر'],
];

// ── الأبراج ──
export const ZODIAC_SIGNS = [
  { en:'Capricorn',  ar:'الجدي',    emoji:'♑' },
  { en:'Aquarius',   ar:'الدلو',    emoji:'♒' },
  { en:'Pisces',     ar:'الحوت',    emoji:'♓' },
  { en:'Aries',      ar:'الحمل',    emoji:'♈' },
  { en:'Taurus',     ar:'الثور',    emoji:'♉' },
  { en:'Gemini',     ar:'الجوزاء',  emoji:'♊' },
  { en:'Cancer',     ar:'السرطان',  emoji:'♋' },
  { en:'Leo',        ar:'الأسد',    emoji:'♌' },
  { en:'Virgo',      ar:'العذراء',  emoji:'♍' },
  { en:'Libra',      ar:'الميزان',  emoji:'♎' },
  { en:'Scorpio',    ar:'العقرب',   emoji:'♏' },
  { en:'Sagittarius',ar:'القوس',    emoji:'♐' },
];

// ── المسارات ──
export const TRACKS = [
  { id:'spy',     icon:'🕵️', name:'Spy & Mystery',  nameAr:'التجسس والغموض',  color:'#C0C0C0', bg:'rgba(192,192,192,0.08)', desc:'A secret mission awaits.',        preview:'"Today, I received a strange message."', cinematic:'Dark corridors · Hidden files',  sounds:['📻 Radio static','👣 Footsteps','🔫 Tension click','🚨 Alert siren'] },
  { id:'love',    icon:'❤️', name:'Love Story',      nameAr:'قصة حب',          color:'#c0392b', bg:'rgba(139,0,0,0.10)',     desc:'Your heart leads the story.',     preview:'"She looked at me. I could not speak."',  cinematic:'Sunset walks · Love letters',   sounds:['💌 Message chime','💓 Heartbeat','🎹 Piano key','🕊️ Dove wings'] },
  { id:'family',  icon:'👨‍👩‍👧', name:'Family',         nameAr:'الأسرة',          color:'#8B4513', bg:'rgba(139,69,19,0.10)',   desc:'Family bonds are stronger.',      preview:'"My mother called. Her voice was warm."',  cinematic:'Family dinners · Home warmth',  sounds:['😄 Children laughing','🚪 Door opening','🍽️ Kitchen','📞 Phone'] },
  { id:'crime',   icon:'⚖️', name:'Crime & Justice', nameAr:'الجريمة والعدالة',color:'#4a90d9', bg:'rgba(27,58,107,0.12)',   desc:'The truth is hidden.',             preview:'"The judge looked at the file."',           cinematic:'Courtroom · Investigation',     sounds:['⚖️ Gavel','🔗 Handcuffs','🚔 Police siren','📁 File stamp'] },
  { id:'medical', icon:'🏥', name:'Medical',          nameAr:'الطب والإنقاذ',   color:'#2E8B57', bg:'rgba(46,139,87,0.10)',   desc:'Every second counts.',             preview:'"The doctor entered quickly."',             cinematic:'Emergency · Life-saving',       sounds:['🚑 Ambulance','💓 Heart monitor','⚡ Defibrillator','🩺 Stethoscope'] },
];

// ── أصوات المسارات ──
export const TRACK_SOUNDS = {
  spy:     { ambient:'🎵 Suspense background', sounds:[{icon:'📻',label:'Radio static',trigger:'mission start'},{icon:'👣',label:'Footsteps',trigger:'hero moves'},{icon:'🔫',label:'Tension click',trigger:'danger moment'},{icon:'🚨',label:'Alert siren',trigger:'mission alert'},{icon:'🎯',label:'Target beep',trigger:'correct answer'}] },
  love:    { ambient:'🎵 Soft romantic piano',  sounds:[{icon:'💌',label:'Message chime',trigger:'letter arrives'},{icon:'💓',label:'Heartbeat',trigger:'emotional moment'},{icon:'🎹',label:'Piano key',trigger:'correct answer'},{icon:'🕊️',label:'Dove wings',trigger:'reunion scene'}] },
  family:  { ambient:'🎵 Warm acoustic guitar', sounds:[{icon:'😄',label:'Children laughing',trigger:'happy moment'},{icon:'🚪',label:'Door opening',trigger:'arrival scene'},{icon:'🍽️',label:'Kitchen sounds',trigger:'home scene'},{icon:'👏',label:'Applause',trigger:'correct answer'}] },
  crime:   { ambient:'🎵 Dark courtroom music', sounds:[{icon:'⚖️',label:'Gavel strike',trigger:'verdict moment'},{icon:'🔗',label:'Handcuffs',trigger:'arrest scene'},{icon:'🚔',label:'Police siren',trigger:'chase scene'},{icon:'🔔',label:'Court bell',trigger:'correct answer'}] },
  medical: { ambient:'🎵 Hospital ambient hum', sounds:[{icon:'🚑',label:'Ambulance siren',trigger:'emergency'},{icon:'💓',label:'Heart monitor',trigger:'patient stable'},{icon:'⚡',label:'Defibrillator',trigger:'critical moment'},{icon:'✅',label:'Heartbeat restored',trigger:'correct answer'}] },
};

// ── بيانات القصة ──
export const STORY_LINES = {
  spy: [
    { text:'Today, I received a strange message. It said: Come alone.', ar:'اليوم استلمت رسالة غريبة. قالت: تعال وحدك.', words:[{id:1,word:'received',emoji:'📩',ar:'استلمت',phonetic:'/rɪˈsiːvd/',pron:'ريسيفد',grammar:'Past tense verb'},{id:2,word:'strange',emoji:'❓',ar:'غريب',phonetic:'/streɪndʒ/',pron:'سترينج',grammar:'Adjective'},{id:3,word:'message',emoji:'✉️',ar:'رسالة',phonetic:'/ˈmes.ɪdʒ/',pron:'ميسيج',grammar:'Noun'},{id:4,word:'alone',emoji:'🚶',ar:'وحدك',phonetic:'/əˈloʊn/',pron:'ألون',grammar:'Adjective'}] },
    { text:'I looked around. There was a man watching me. His eyes were cold.', ar:'نظرت حولي. كان هناك رجل يراقبني. عيونه جامدة.', words:[{id:5,word:'looked',emoji:'👀',ar:'نظرت',phonetic:'/lʊkt/',pron:'لوكت',grammar:'Past tense'},{id:6,word:'watching',emoji:'🔍',ar:'يراقب',phonetic:'/ˈwɒtʃ.ɪŋ/',pron:'واتشينج',grammar:'Continuous'},{id:7,word:'cold',emoji:'🧊',ar:'بارد',phonetic:'/koʊld/',pron:'كولد',grammar:'Adjective'}] },
    { text:'He walked toward me slowly. He stopped and handed me an envelope.', ar:'مشى نحوي ببطء. توقف وناولني مغلفاً.', words:[{id:8,word:'walked',emoji:'🚶',ar:'مشى',phonetic:'/wɔːkt/',pron:'ووكت',grammar:'Past tense'},{id:9,word:'slowly',emoji:'🐢',ar:'ببطء',phonetic:'/ˈsloʊ.li/',pron:'سلولي',grammar:'Adverb'},{id:10,word:'envelope',emoji:'✉️',ar:'مغلف',phonetic:'/ˈen.və.loʊp/',pron:'إنفيلوب',grammar:'Noun'}] },
    { text:'Inside was a photo. An address written in red ink. One word: Tonight.', ar:'بداخله صورة. عنوان بالحبر الأحمر. كلمة: الليلة.', words:[{id:11,word:'photo',emoji:'📸',ar:'صورة',phonetic:'/ˈfoʊ.toʊ/',pron:'فوتو',grammar:'Noun'},{id:12,word:'address',emoji:'📍',ar:'عنوان',phonetic:'/ˈæd.res/',pron:'أدريس',grammar:'Noun'},{id:13,word:'tonight',emoji:'🌙',ar:'الليلة',phonetic:'/təˈnaɪt/',pron:'تونايت',grammar:'Adverb'}] },
    { text:'I thought of my family. But the mission was important. I walked to the door.', ar:'فكرت بعائلتي. لكن المهمة مهمة. مشيت نحو الباب.', words:[{id:14,word:'thought',emoji:'💭',ar:'فكرت',phonetic:'/θɔːt/',pron:'ثوت',grammar:'Past tense'},{id:15,word:'mission',emoji:'🎯',ar:'مهمة',phonetic:'/ˈmɪʃ.ən/',pron:'ميشن',grammar:'Noun'},{id:16,word:'important',emoji:'❗',ar:'مهم',phonetic:'/ɪmˈpɔːr.tənt/',pron:'إمبورتنت',grammar:'Adjective'}] },
  ],
};

// ── بيانات التعاون ──
export const COOP_STORY = {
  spy:     [{hero:'Ahmed entered the building.',partner:'His partner Khalid was already waiting.'},{hero:'Ahmed said, "Did you bring the files?"',partner:'Khalid nodded and opened his bag.'},{hero:'Ahmed received a strange envelope.',partner:'Khalid watched him open it.'},{hero:'Ahmed read the message in silence.',partner:'Khalid stood near the door.'},{hero:'Ahmed said, "The mission is dangerous."',partner:'Khalid answered, "I know, but it\'s important."'}],
  medical: [{hero:'Dr. Ali rushed into the emergency room.',partner:'Nurse Sara handed him the patient file.'},{hero:'He checked the patient quickly.',partner:'Sara connected the monitor.'},{hero:'Ali said, "We need to act fast."',partner:'Sara prepared the equipment.'},{hero:'Ali gave the first injection.',partner:'Sara watched the vital signs.'},{hero:'Ali said, "The patient is stable."',partner:'Sara smiled with relief.'}],
  love:    [{hero:'Rami walked into the garden slowly.',partner:'Layla was reading under the tree.'},{hero:'He called her name softly.',partner:'She looked up and smiled.'},{hero:'Rami said, "I have something to tell you."',partner:'Layla closed her book gently.'},{hero:'He handed her a small letter.',partner:'She opened it with trembling hands.'},{hero:'Rami waited for her answer.',partner:'Layla whispered, "Yes."'}],
  crime:   [{hero:'Detective Omar entered the courtroom.',partner:'His partner Nour reviewed the evidence.'},{hero:'Omar spoke clearly to the judge.',partner:'Nour showed the files to the jury.'},{hero:'Omar said, "The evidence is clear."',partner:'Nour pointed to the key document.'},{hero:'Omar presented the final witness.',partner:'Nour watched the suspect carefully.'},{hero:'Omar said, "We have the truth."',partner:'Nour nodded with confidence.'}],
  family:  [{hero:'Kareem arrived home after a long day.',partner:'His mother welcomed him warmly.'},{hero:'He sat at the dinner table quietly.',partner:'She placed his favorite food before him.'},{hero:'Kareem said, "I have important news."',partner:'She sat down and listened carefully.'},{hero:'He told her about his new opportunity.',partner:'She held his hand and smiled.'},{hero:'Kareem said, "I could not do it without you."',partner:'She said, "I am always proud of you."'}],
};

export const COOP_WORDS = {
  spy:     [['entered','building'],['Did','bring','files'],['received','envelope'],['read','silence'],['mission','dangerous']],
  medical: [['rushed','emergency'],['checked','quickly'],['need','act','fast'],['gave','injection'],['patient','stable']],
  love:    [['walked','garden'],['called','softly'],['something','tell'],['handed','letter'],['waited','answer']],
  crime:   [['entered','courtroom'],['spoke','clearly'],['evidence','clear'],['presented','witness'],['have','truth']],
  family:  [['arrived','home'],['sat','quietly'],['important','news'],['told','opportunity'],['could','without']],
};

// ملاحظة: كانت هنا مصفوفتان ثابتتان (DICT_WORDS, RESCUE_WORDS) بكلمات وهمية جاهزة —
// تم حذفهما لأنهما غير مستخدمتين بأي مكان بالكود إطلاقًا. شاشتا Dict.js وRescue.js
// تعتمدان فعليًا على getWordBankWords() من AppContext، وهي بيانات حقيقية من تقدّم المستخدم.

// ── معدّل بيبو التحفيزي — رقم مرجعي ثابت لبيبو كشخصية بالتطبيق، مش تظاهر بمستخدم حقيقي آخر ──
export const BIBO_PACE = { weeklyWords: 15, totalWords: 150 };

// ── لوحة المتصدرين ──
// ملاحظة: القائمة القديمة هنا كانت تحتوي أسماء ومستخدمين وهميين — تمت إزالتها.
// شاشة Leaderboard.js تستخدم الآن BIBO_PACE بدلًا منها (سباق حقيقي مع بيبو، بدون بيانات مزيّفة).

// ── متجر القرطاسية ──
export const STORE_ITEMS = [
  { id:'pen_basic',    type:'pen',    name:'Classic Pen',    nameAr:'قلم كلاسيكي',    icon:'🖊️', color:'#C0C0C0', price:10,  ink:100,  desc:'Basic pen for everyday writing' },
  { id:'pen_gold',     type:'pen',    name:'Golden Pen',     nameAr:'قلم ذهبي',       icon:'✒️', color:'#FFB300', price:30,  ink:250,  desc:'Premium pen with extra ink' },
  { id:'pen_diamond',  type:'pen',    name:'Diamond Pen',    nameAr:'قلم الماسي',     icon:'💎', color:'#4a90d9', price:80,  ink:500,  desc:'Luxury pen that never runs out quickly' },
  { id:'eraser_small', type:'eraser', name:'Small Eraser',   nameAr:'ممحاة صغيرة',   icon:'🧹', color:'#ff6b6b', price:5,   uses:20,  desc:'Good for a few mistakes' },
  { id:'eraser_large', type:'eraser', name:'Large Eraser',   nameAr:'ممحاة كبيرة',   icon:'🧽', color:'#c0392b', price:15,  uses:60,  desc:'Handles more corrections' },
  { id:'paper_small',  type:'paper',  name:'Small Pack',     nameAr:'حزمة صغيرة',    icon:'📄', color:'#2E8B57', price:8,   pages:20, desc:'20 pages for your exercises' },
  { id:'paper_large',  type:'paper',  name:'Large Pack',     nameAr:'حزمة كبيرة',    icon:'📋', color:'#1B3A6B', price:20,  pages:60, desc:'60 pages to keep you going' },
  { id:'paper_bundle', type:'paper',  name:'Mega Bundle',    nameAr:'حزمة ضخمة',     icon:'📚', color:'#8B4513', price:45,  pages:150,desc:'150 pages for the dedicated learner' },
];

// ── إكسسوارات بيبو الدائمة (Cosmetics) — تُشترى مرة واحدة وتبقى للأبد ──
// كل عنصر له slot واحد بس (hat / glasses / ring)، والمستخدم يقدر يلبس عنصر واحد بكل slot بنفس الوقت.
export const COSMETIC_ITEMS = [
  { id: 'hat_cap',     slot: 'hat',     emoji: '🧢', name: 'Cap',         nameAr: 'كاب رياضي',    price: 25 },
  { id: 'hat_grad',    slot: 'hat',     emoji: '🎓', name: 'Grad Cap',    nameAr: 'قبعة تخرّج',    price: 35 },
  { id: 'hat_top',     slot: 'hat',     emoji: '🎩', name: 'Top Hat',     nameAr: 'قبعة أنيقة',    price: 45 },
  { id: 'hat_crown',   slot: 'hat',     emoji: '👑', name: 'Crown',       nameAr: 'تاج ملكي',      price: 70 },
  { id: 'glasses_reg', slot: 'glasses', emoji: '👓', name: 'Glasses',     nameAr: 'نظارة طبية',    price: 20 },
  { id: 'glasses_sun', slot: 'glasses', emoji: '🕶️', name: 'Sunglasses',  nameAr: 'نظارة شمسية',   price: 30 },
  { id: 'ring_gold',   slot: 'ring',    color: '#FFD700', name: 'Gold Ring',  nameAr: 'حلقة ذهبية',   price: 30 },
  { id: 'ring_royal',  slot: 'ring',    color: '#7b5fd4', name: 'Royal Ring', nameAr: 'حلقة ملكية',   price: 30 },
  { id: 'ring_ruby',   slot: 'ring',    color: '#E91E63', name: 'Ruby Ring',  nameAr: 'حلقة ياقوتية', price: 30 },
];

export const COSMETIC_SLOTS = [
  { key: 'hat',     label: 'Hats',     labelAr: 'القبعات' },
  { key: 'glasses', label: 'Glasses',  labelAr: 'النظارات' },
  { key: 'ring',    label: 'Rings',    labelAr: 'الحلقات' },
];

// ── تحديات أسبوعية — مبنية على استخدام حقيقي فقط، بدون أي بيانات وهمية أو منافسين مزيّفين ──
// كل تحدي بيتصفّر تلقائيًا كل أسبوع (حسب توقيت ISO week)
export const WEEKLY_CHALLENGES = [
  { id: 'words',    metric: 'wordsLearned', target: 10, reward: 20, icon: '📝', label: 'Learn 10 new words',      labelAr: 'تعلّم 10 كلمات جديدة' },
  { id: 'episodes', metric: 'episodesDone', target: 2,  reward: 25, icon: '🎬', label: 'Finish 2 episodes',       labelAr: 'أكمل حلقتين' },
  { id: 'rescue',   metric: 'wordsRescued', target: 3,  reward: 15, icon: '🆘', label: 'Rescue 3 fading words',   labelAr: 'أنقذ 3 كلمات مهدَّدة بالنسيان' },
];

// ── مستوى بيبو — يرتفع فعليًا مع عدد الحلقات الحقيقية اللي أكملتها، مو رقم عشوائي أو وهمي ──
// الفكرة: بيبو "يتعلّم معك"، فكل ما أكملت حلقات أكتر، بيبو "يكبر" مستواه هو كمان.
export const BIBO_LEVELS = [
  { min: 0,  max: 1,  en: 'Bibo the Hatchling',   ar: 'بيبو الصغير',      color: '#8B4513' },
  { min: 2,  max: 4,  en: 'Bibo the Learner',      ar: 'بيبو المتعلّم',     color: '#1B3A6B' },
  { min: 5,  max: 7,  en: 'Bibo the Companion',    ar: 'بيبو الرفيق',      color: '#2E8B57' },
  { min: 8,  max: 11, en: 'Bibo the Storyteller',  ar: 'بيبو الحكواتي',    color: '#C0C0C0' },
  { min: 12, max: 999,en: 'Bibo the Master',       ar: 'بيبو الخبير',      color: '#FFB300' },
];
export const getBiboLevel = (episodesDone) => BIBO_LEVELS.find(l => episodesDone >= l.min && episodesDone <= l.max) || BIBO_LEVELS[0];

export const GIFT_REWARDS = [
  { type:'gems',   amount:10,  icon:'💎', label:'10 Gems',          labelAr:'10 جواهر' },
  { type:'gems',   amount:25,  icon:'💎', label:'25 Gems',          labelAr:'25 جواهر' },
  { type:'pen',    item:'pen_basic', icon:'🖊️', label:'Free Pen',  labelAr:'قلم مجاني' },
  { type:'eraser', item:'eraser_small', icon:'🧹', label:'Free Eraser', labelAr:'ممحاة مجانية' },
  { type:'paper',  item:'paper_small', icon:'📄', label:'20 Free Pages', labelAr:'20 صفحة مجانية' },
];

// ── تخصيص غلاف الكتاب بالمكتبة ──
export const COVER_COLORS = ['#2E8B57', '#3F51B5', '#E91E63', '#FF9800', '#9C27B0', '#00BCD4', '#F44336', '#8BC34A'];

export const COVER_STICKERS = [
  { id: 'star',     emoji: '⭐', price: 15, name: 'Star',     nameAr: 'نجمة' },
  { id: 'heart',    emoji: '❤️', price: 15, name: 'Heart',    nameAr: 'قلب' },
  { id: 'sparkles', emoji: '✨', price: 15, name: 'Sparkles', nameAr: 'بريق' },
  { id: 'balloon',  emoji: '🎈', price: 15, name: 'Balloon',  nameAr: 'بالون' },
  { id: 'rainbow',  emoji: '🌈', price: 20, name: 'Rainbow',  nameAr: 'قوس قزح' },
  { id: 'rocket',   emoji: '🚀', price: 20, name: 'Rocket',   nameAr: 'صاروخ' },
  { id: 'crown',    emoji: '👑', price: 25, name: 'Crown',    nameAr: 'تاج' },
  { id: 'trophy',   emoji: '🏆', price: 25, name: 'Trophy',   nameAr: 'كأس' },
];

// ── دوال مساعدة ──
export const getLevel    = (score) => LEVEL_TITLES.find(l => score >= l.min && score <= l.max) || LEVEL_TITLES[0];
export const getPrefix   = (jobEn) => { const j = JOBS.find(x => x.en === jobEn); return j ? j.prefix : ''; };

/** يحسب البرج تلقائيًا من اليوم واسم الشهر (الإنجليزي، زي "March") */
export const getZodiac = (day, monthEn) => {
  const d = parseInt(day, 10);
  const ranges = [
    ['Capricorn', 'January', 19], ['Aquarius', 'January', 31],
    ['Aquarius', 'February', 18], ['Pisces', 'February', 29],
    ['Pisces', 'March', 20], ['Aries', 'March', 31],
    ['Aries', 'April', 19], ['Taurus', 'April', 30],
    ['Taurus', 'May', 20], ['Gemini', 'May', 31],
    ['Gemini', 'June', 20], ['Cancer', 'June', 30],
    ['Cancer', 'July', 22], ['Leo', 'July', 31],
    ['Leo', 'August', 22], ['Virgo', 'August', 31],
    ['Virgo', 'September', 22], ['Libra', 'September', 30],
    ['Libra', 'October', 22], ['Scorpio', 'October', 31],
    ['Scorpio', 'November', 21], ['Sagittarius', 'November', 30],
    ['Sagittarius', 'December', 21], ['Capricorn', 'December', 31],
  ];
  const hit = ranges.find(([, m, upTo]) => m === monthEn && d <= upTo);
  const signName = hit ? hit[0] : 'Capricorn';
  return ZODIAC_SIGNS.find(z => z.en === signName) || ZODIAC_SIGNS[0];
};
export const getTrack    = (id)    => TRACKS.find(tr => tr.id === id) || TRACKS[0];
export const itemLabel   = (item, lang) => lang === 'ar' ? item[1] : item[0];
export const fullName    = (u)     => { const p = getPrefix(u.job); return (p ? p + ' ' : '') + u.firstName + ' ' + u.lastName; };

