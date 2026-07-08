import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getLevel, getPrefix, fullName } from '../data';
import { touchLastSeen } from '../utils/companion';
import { scheduleBiboReminder, cancelBiboReminders } from '../utils/notifications';
import { loadMany, saveJSON, removeKeys } from '../utils/storage';
import { prepareAudioMode } from '../utils/sounds';
import { playSfx } from '../utils/sfx';

const AppContext = createContext(null);

const DEFAULT_STATIONERY = {
  pen:    { id: 'pen_basic', inkLeft: 100 },
  eraser: { uses: 20 },
  pages:  { left: 30 },
};

export function AppProvider({ children }) {
  const [lang, setLang]   = useState('ar');
  const [user, setUser]   = useState(null);
  const [track, setTrack] = useState(null);
  const [gems, setGems]   = useState(50);
  const [companion, setCompanion] = useState({ gapHours: 0, isComeback: false, streak: 1 });
  const [stationery, setStationery] = useState(DEFAULT_STATIONERY);
  const [voiceOn, setVoiceOn] = useState(true);
  const [library, setLibrary] = useState([]);
  const [bookCovers, setBookCovers] = useState({}); // { "trackId::episodeId": { color, stickers:[ids] } }
  const [ownedStickers, setOwnedStickers] = useState([]); // ["star","heart",...]
  const [episodeProgress, setEpisodeProgress] = useState({});
  const [wordBank, setWordBank] = useState({}); // { [trackId]: { [wordId]: entry } }
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  // عند فتح التطبيق: حمّل كل بيانات المستخدم المحفوظة قبل كده
  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await loadMany({
        lang: 'ar',
        user: null,
        track: null,
        gems: 50,
        stationery: DEFAULT_STATIONERY,
        voiceOn: true,
        library: [],
        bookCovers: {},
        ownedStickers: [],
        episodeProgress: {},
        wordBank: {},
      });
      if (!mounted) return;
      setLang(saved.lang);
      setUser(saved.user);
      setTrack(saved.track);
      setGems(saved.gems);
      setStationery(saved.stationery);
      setVoiceOn(saved.voiceOn);
      setLibrary(saved.library);
      setBookCovers(saved.bookCovers);
      setOwnedStickers(saved.ownedStickers);
      setEpisodeProgress(saved.episodeProgress);
      setWordBank(saved.wordBank);
      hydratedRef.current = true;
      setHydrated(true);
    })();
    return () => { mounted = false; };
  }, []);

  // عند فتح التطبيق: سجّل وقت الدخول، احسب فجوة الغياب، وجدول تذكير بيبو القادم
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { gapHours, streak } = await touchLastSeen();
      if (!mounted) return;
      setCompanion({ gapHours, isComeback: gapHours >= 20, streak });
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    scheduleBiboReminder(lang, 20);
  }, [lang]);

  useEffect(() => { prepareAudioMode(); }, []);

  // حفظ تلقائي لكل جزء من بيانات المستخدم كل ما يتغير (بعد أول تحميل بس)
  useEffect(() => { if (hydratedRef.current) saveJSON('lang', lang); }, [lang]);
  useEffect(() => { if (hydratedRef.current) saveJSON('user', user); }, [user]);
  useEffect(() => { if (hydratedRef.current) saveJSON('track', track); }, [track]);
  useEffect(() => { if (hydratedRef.current) saveJSON('gems', gems); }, [gems]);
  useEffect(() => { if (hydratedRef.current) saveJSON('stationery', stationery); }, [stationery]);
  useEffect(() => { if (hydratedRef.current) saveJSON('voiceOn', voiceOn); }, [voiceOn]);
  useEffect(() => { if (hydratedRef.current) saveJSON('library', library); }, [library]);
  useEffect(() => { if (hydratedRef.current) saveJSON('bookCovers', bookCovers); }, [bookCovers]);
  useEffect(() => { if (hydratedRef.current) saveJSON('ownedStickers', ownedStickers); }, [ownedStickers]);
  useEffect(() => { if (hydratedRef.current) saveJSON('episodeProgress', episodeProgress); }, [episodeProgress]);
  useEffect(() => { if (hydratedRef.current) saveJSON('wordBank', wordBank); }, [wordBank]);

  const addGems = useCallback((amount) => {
    setGems(prev => prev + amount);
  }, []);

  const useInk = useCallback(() => {
    playSfx('writing');
    setStationery(prev => ({
      ...prev,
      pen: { ...prev.pen, inkLeft: Math.max(0, prev.pen.inkLeft - 1) },
    }));
  }, []);

  const useEraser = useCallback(() => {
    playSfx('eraser');
    setStationery(prev => ({
      ...prev,
      eraser: { uses: Math.max(0, prev.eraser.uses - 1) },
    }));
  }, []);

  const usePage = useCallback(() => {
    playSfx('pageTurn');
    setStationery(prev => ({
      ...prev,
      pages: { left: Math.max(0, prev.pages.left - 1) },
    }));
  }, []);

  const buyItem = useCallback((item) => {
    if (gems < item.price) return false;
    setGems(prev => prev - item.price);
    setStationery(prev => {
      if (item.type === 'pen')    return { ...prev, pen:    { id: item.id, inkLeft: item.ink } };
      if (item.type === 'eraser') return { ...prev, eraser: { uses: item.uses } };
      if (item.type === 'paper')  return { ...prev, pages:  { left: prev.pages.left + item.pages } };
      return prev;
    });
    return true;
  }, [gems]);

  const claimGift = useCallback((reward) => {
    if (reward.type === 'gems') {
      addGems(reward.amount);
    } else if (reward.type === 'pen') {
      setStationery(prev => ({ ...prev, pen: { id: reward.item, inkLeft: 100 } }));
    } else if (reward.type === 'eraser') {
      setStationery(prev => ({ ...prev, eraser: { uses: prev.eraser.uses + 20 } }));
    } else if (reward.type === 'paper') {
      setStationery(prev => ({ ...prev, pages: { left: prev.pages.left + 20 } }));
    }
  }, [addGems]);

  /**
   * يسجّل حلقة اتخلصت كـ "كتاب" في المكتبة. لو الكتاب موجود قبل كده
   * (نفس المسار ونفس الحلقة) بيحدّثه بدل ما يكرره على الرف.
   */
  /** بيرجع حالة تقدم مسار معين: { unlocked, completed } */
  /** يضيف كلمة اتعلمها المستخدم فعليًا لبنك الكلمات، مع حساب تاريخ الانتهاء */
  const addWordToBank = useCallback((trackId, wordId, data, episodeNum, expireAfterEpisodes) => {
    setWordBank(prev => {
      const trackBank = prev[trackId] || {};
      const existing = trackBank[wordId];
      const entry = {
        id: wordId,
        word: data.word,
        ar: data.ar,
        phonetic: data.phonetic,
        pron: data.pron,
        emoji: data.emoji,
        grammar: data.grammar,
        learnedInEpisode: existing?.learnedInEpisode ?? episodeNum,
        expireAfterEpisode: episodeNum + (expireAfterEpisodes || 4),
        rescuedCount: existing?.rescuedCount || 0,
      };
      return { ...prev, [trackId]: { ...trackBank, [wordId]: entry } };
    });
  }, []);

  /** إنقاذ كلمة: بيمدد تاريخ انتهائها من الحلقة الحالية */
  const rescueWord = useCallback((trackId, wordId, extendBy = 4) => {
    setWordBank(prev => {
      const trackBank = prev[trackId] || {};
      const existing = trackBank[wordId];
      if (!existing) return prev;
      const curUnlocked = (episodeProgress[trackId]?.unlocked) || 1;
      return {
        ...prev,
        [trackId]: {
          ...trackBank,
          [wordId]: { ...existing, expireAfterEpisode: curUnlocked + extendBy, rescuedCount: existing.rescuedCount + 1 },
        },
      };
    });
  }, [episodeProgress]);

  /** بيرجع كل الكلمات المتعلمة فعليًا (من كل المسارات) مع حساب حالة كل كلمة */
  const getWordBankWords = useCallback(() => {
    const out = [];
    Object.entries(wordBank).forEach(([trackId, words]) => {
      const curUnlocked = episodeProgress[trackId]?.unlocked || 1;
      Object.values(words).forEach(w => {
        const episodesLeft = w.expireAfterEpisode - curUnlocked;
        out.push({
          id: trackId + '_' + w.id,
          wordId: w.id,
          trackId,
          en: w.word,
          ar: w.ar,
          phonetic: w.phonetic,
          pron: w.pron,
          emoji: w.emoji,
          grammar: w.grammar,
          episodesLeft,
          status: episodesLeft <= 0 ? 'forgotten' : episodesLeft <= 1 ? 'review' : 'learned',
        });
      });
    });
    return out;
  }, [wordBank, episodeProgress]);

  const getEpisodeState = useCallback((trackId) => {
    return episodeProgress[trackId] || { unlocked: 1, completed: [] };
  }, [episodeProgress]);

  /** يسجّل حلقة كمكتملة ويفتح اللي بعدها بالتسلسل */
  const completeEpisode = useCallback((trackId, episodeNumber) => {
    setEpisodeProgress(prev => {
      const cur = prev[trackId] || { unlocked: 1, completed: [] };
      const completed = cur.completed.includes(episodeNumber) ? cur.completed : [...cur.completed, episodeNumber];
      const unlocked = Math.max(cur.unlocked, episodeNumber + 1);
      return { ...prev, [trackId]: { unlocked, completed } };
    });
  }, []);

  const addLibraryEntry = useCallback((entry) => {
    setLibrary(prev => {
      const idx = prev.findIndex(b => b.trackId === entry.trackId && b.episodeId === entry.episodeId);
      if (idx === -1) return [...prev, entry];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...entry, readCount: (copy[idx].readCount || 1) + 1 };
      return copy;
    });
  }, []);

  const coverKey = (trackId, episodeId) => `${trackId}::${episodeId}`;

  /** يشتري ملصق تخصيص الغلاف بالجواهر (لو مش مملوك أصلًا). بيرجع true لو نجحت العملية */
  const buySticker = useCallback((stickerId, price) => {
    if (ownedStickers.includes(stickerId)) return true;
    if (gems < price) return false;
    setGems(prev => prev - price);
    setOwnedStickers(prev => [...prev, stickerId]);
    return true;
  }, [gems, ownedStickers]);

  /** بيغيّر لون غلاف كتاب معيّن بالمكتبة */
  const setBookCoverColor = useCallback((trackId, episodeId, color) => {
    const key = coverKey(trackId, episodeId);
    setBookCovers(prev => ({ ...prev, [key]: { ...(prev[key] || {}), color } }));
  }, []);

  /** بيضيف/بيشيل ملصق من غلاف كتاب معيّن (بحد أقصى 3 ملصقات على نفس الغلاف) */
  const toggleBookSticker = useCallback((trackId, episodeId, stickerId) => {
    const key = coverKey(trackId, episodeId);
    setBookCovers(prev => {
      const current = prev[key] || {};
      const stickers = current.stickers || [];
      const has = stickers.includes(stickerId);
      const next = has ? stickers.filter(s => s !== stickerId) : [...stickers, stickerId].slice(0, 3);
      return { ...prev, [key]: { ...current, stickers: next } };
    });
  }, []);

  const logout = useCallback(async () => {
    await removeKeys(['user', 'track', 'gems', 'stationery', 'library', 'episodeProgress', 'wordBank', 'bookCovers', 'ownedStickers']);
    await cancelBiboReminders();
    setUser(null);
    setTrack(null);
    setGems(50);
    setStationery(DEFAULT_STATIONERY);
    setLibrary([]);
    setEpisodeProgress({});
    setWordBank({});
    setBookCovers({});
    setOwnedStickers([]);
  }, []);

  const value = {
    lang, setLang,
    user, setUser,
    track, setTrack,
    gems, addGems,
    companion,
    stationery, useInk, useEraser, usePage, buyItem, claimGift,
    voiceOn, setVoiceOn,
    library, addLibraryEntry,
    bookCovers, ownedStickers, buySticker, setBookCoverColor, toggleBookSticker,
    episodeProgress, getEpisodeState, completeEpisode,
    wordBank, addWordToBank, rescueWord, getWordBankWords,
    hydrated, logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
