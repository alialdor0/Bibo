import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert, Modal } from 'react-native';
import { useApp } from '../context/AppContext';
import { t, STORE_ITEMS, GIFT_REWARDS } from '../data';
import { PageHeader, GemsBadge, StationeryBar } from '../components/BiboCard';
import { playSfx } from '../utils/sfx';

const SECTIONS = [
  { key: 'pen',    label: 'Pens',    labelAr: 'الأقلام',    icon: '🖊️' },
  { key: 'eraser', label: 'Erasers', labelAr: 'الممحاة',    icon: '🧹' },
  { key: 'paper',  label: 'Paper',   labelAr: 'الأوراق',    icon: '📄' },
];

export default function Store({ onBack }) {
  const { lang, gems, stationery, buyItem, claimGift } = useApp();
  const T = (k) => t(k, lang);

  const [tab,        setTab]        = useState('pen');
  const [giftModal,  setGiftModal]  = useState(false);
  const [giftResult, setGiftResult] = useState(null);
  const [watching,   setWatching]   = useState(false);

  const items = STORE_ITEMS.filter(i => i.type === tab);

  const handleBuy = (item) => {
    if (gems < item.price) {
      playSfx('wrong');
      Alert.alert('Not enough gems', 'You need ' + item.price + ' gems. Watch an ad to get more!');
      return;
    }
    Alert.alert(
      'Buy ' + item.name + '?',
      item.price + ' gems will be deducted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy', onPress: () => {
          const success = buyItem(item);
          if (success) { playSfx('win'); Alert.alert('Purchased!', item.name + ' is now in your stationery.'); }
          else playSfx('wrong');
        }},
      ]
    );
  };

  const handleWatchAd = () => {
    setWatching(true);
    setTimeout(() => {
      setWatching(false);
      const reward = GIFT_REWARDS[Math.floor(Math.random() * GIFT_REWARDS.length)];
      claimGift(reward);
      playSfx('win');
      setGiftResult(reward);
      setGiftModal(false);
      Alert.alert('Gift Claimed!', lang === 'ar' ? reward.labelAr : reward.label);
    }, 2000);
  };

  const isOwned = (item) => {
    if (item.type === 'pen')    return stationery.pen.id === item.id;
    return false;
  };

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader
        title={T('store')}
        onBack={onBack}
        backLabel={T('back')}
        right={<GemsBadge gems={gems} />}
      />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* شريط القرطاسية الحالية */}
        <View style={s.currentCard}>
          <Text style={s.currentTitle}>My Stationery</Text>
          <StationeryBar stationery={stationery} />
          <View style={s.currentDetails}>
            <View style={s.detailItem}>
              <Text style={s.detailIcon}>🖊️</Text>
              <Text style={s.detailTxt}>{stationery.pen.inkLeft}% ink</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailIcon}>🧹</Text>
              <Text style={s.detailTxt}>{stationery.eraser.uses} uses left</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailIcon}>📄</Text>
              <Text style={s.detailTxt}>{stationery.pages.left} pages left</Text>
            </View>
          </View>
        </View>

        {/* هدية مجانية */}
        <TouchableOpacity style={s.giftCard} onPress={() => setGiftModal(true)}>
          <View style={s.giftLeft}>
            <Text style={s.giftIcon}>🎁</Text>
            <View>
              <Text style={s.giftTitle}>{T('openGift')}</Text>
              <Text style={s.giftDesc}>{T('giftDesc')}</Text>
            </View>
          </View>
          <Text style={s.giftArrow}>→</Text>
        </TouchableOpacity>

        {/* تبويبات المتجر */}
        <View style={s.tabs}>
          {SECTIONS.map(sec => (
            <TouchableOpacity
              key={sec.key}
              style={[s.tab, tab === sec.key ? s.tabActive : null]}
              onPress={() => setTab(sec.key)}
              accessibilityRole="button">
              <Text style={s.tabIcon}>{sec.icon}</Text>
              <Text style={[s.tabTxt, tab === sec.key ? s.tabTxtActive : null]}>
                {lang === 'ar' ? sec.labelAr : sec.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* المنتجات */}
        {items.map(item => (
          <View key={item.id} style={[s.itemCard, { borderColor: item.color + '44' }]}>
            <View style={[s.itemIcon, { backgroundColor: item.color + '22' }]}>
              <Text style={s.itemEmoji}>{item.icon}</Text>
            </View>
            <View style={s.itemInfo}>
              <Text style={s.itemName}>{lang === 'ar' ? item.nameAr : item.name}</Text>
              <Text style={s.itemDesc}>{item.desc}</Text>
              {item.type === 'pen'    ? <Text style={s.itemStat}>{item.ink} ink units</Text>    : null}
              {item.type === 'eraser' ? <Text style={s.itemStat}>{item.uses} uses</Text>         : null}
              {item.type === 'paper'  ? <Text style={s.itemStat}>{item.pages} pages</Text>       : null}
            </View>
            <TouchableOpacity
              style={[s.buyBtn, isOwned(item) ? s.buyBtnOwned : gems < item.price ? s.buyBtnDisabled : { backgroundColor: item.color + 'cc' }]}
              onPress={() => handleBuy(item)}
              disabled={isOwned(item)}
              accessibilityRole="button">
              {isOwned(item) ? (
                <Text style={s.buyBtnTxt}>✓ {T('owned')}</Text>
              ) : (
                <View style={s.buyBtnInner}>
                  <Text style={s.buyBtnGem}>💎</Text>
                  <Text style={s.buyBtnTxt}>{item.price}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* كيفية كسب الجواهر */}
        <View style={s.earnCard}>
          <Text style={s.earnTitle}>How to earn gems 💎</Text>
          {[
            { icon: '📝', label: 'Complete a word phase', gems: '+2' },
            { icon: '🎬', label: 'Finish an episode',     gems: '+10' },
            { icon: '🚨', label: 'Rescue a word',          gems: '+3' },
            { icon: '🤝', label: 'Complete Co-op story',   gems: '+25' },
            { icon: '🔥', label: '7-day streak bonus',     gems: '+15' },
            { icon: '🎁', label: 'Watch a gift ad',         gems: '+10' },
          ].map(e => (
            <View key={e.label} style={s.earnRow}>
              <Text style={s.earnIcon}>{e.icon}</Text>
              <Text style={s.earnLabel}>{e.label}</Text>
              <Text style={s.earnGems}>{e.gems}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* نافذة الهدية */}
      <Modal visible={giftModal} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{T('openGift')}</Text>
            <Text style={s.modalDesc}>{T('giftDesc')}</Text>
            <View style={s.giftPreview}>
              {GIFT_REWARDS.map((r, i) => (
                <View key={String(i)} style={s.giftPreviewItem}>
                  <Text style={s.giftPreviewIcon}>{r.icon}</Text>
                  <Text style={s.giftPreviewLabel}>{lang === 'ar' ? r.labelAr : r.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[s.watchBtn, watching ? { opacity: 0.6 } : null]}
              onPress={handleWatchAd}
              disabled={watching}>
              <Text style={s.watchBtnTxt}>{watching ? 'Watching ad...' : 'Watch Ad & Claim Gift'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalClose} onPress={() => setGiftModal(false)}>
              <Text style={s.modalCloseTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#08080f' },
  content:         { padding: 16, paddingBottom: 40 },
  currentCard:     { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 12 },
  currentTitle:    { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 10 },
  currentDetails:  { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  detailItem:      { alignItems: 'center', gap: 4 },
  detailIcon:      { fontSize: 20 },
  detailTxt:       { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  giftCard:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,179,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,179,0,0.3)', borderRadius: 14, padding: 16, marginBottom: 16 },
  giftLeft:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  giftIcon:        { fontSize: 32 },
  giftTitle:       { fontSize: 15, fontWeight: '700', color: '#fff' },
  giftDesc:        { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  giftArrow:       { color: '#FFB300', fontSize: 20 },
  tabs:            { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 3, marginBottom: 14 },
  tab:             { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, gap: 2 },
  tabActive:       { backgroundColor: '#1B3A6B' },
  tabIcon:         { fontSize: 18 },
  tabTxt:          { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  tabTxtActive:    { color: '#fff', fontWeight: '700' },
  itemCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  itemIcon:        { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  itemEmoji:       { fontSize: 28 },
  itemInfo:        { flex: 1 },
  itemName:        { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  itemDesc:        { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  itemStat:        { fontSize: 11, color: '#FFB300', fontWeight: '600' },
  buyBtn:          { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, minWidth: 70, alignItems: 'center' },
  buyBtnOwned:     { backgroundColor: 'rgba(46,139,87,0.2)', borderWidth: 1, borderColor: 'rgba(46,139,87,0.4)' },
  buyBtnDisabled:  { backgroundColor: 'rgba(255,255,255,0.06)' },
  buyBtnInner:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  buyBtnGem:       { fontSize: 14 },
  buyBtnTxt:       { color: '#fff', fontSize: 13, fontWeight: '700' },
  earnCard:        { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, marginTop: 8 },
  earnTitle:       { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  earnRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  earnIcon:        { fontSize: 18, width: 28 },
  earnLabel:       { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  earnGems:        { fontSize: 13, fontWeight: '700', color: '#FFB300' },
  modalBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard:       { backgroundColor: '#12121f', borderWidth: 1, borderColor: 'rgba(255,179,0,0.3)', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' },
  modalTitle:      { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  modalDesc:       { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  giftPreview:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
  giftPreviewItem: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10, width: '28%' },
  giftPreviewIcon: { fontSize: 24, marginBottom: 4 },
  giftPreviewLabel:{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  watchBtn:        { width: '100%', backgroundColor: '#FFB300', borderRadius: 13, padding: 14, alignItems: 'center', marginBottom: 10 },
  watchBtnTxt:     { color: '#000', fontSize: 15, fontWeight: '800' },
  modalClose:      { padding: 10 },
  modalCloseTxt:   { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
