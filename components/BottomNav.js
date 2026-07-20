import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { inkColor } from './Themed';

export default function BottomNav({ active, onNav, T }) {
  const { darkMode, fontScale } = useApp();
  const items = [
    { id: 'home',      icon: '🏠', label: T('home')      },
    { id: 'library',   icon: '📖', label: T('library')   },
    { id: 'challenge', icon: '🏆', label: T('challenge') },
    { id: 'profile',   icon: '👤', label: T('profile')   },
  ];
  return (
    <View style={[s.bottomNav, {
      backgroundColor: inkColor(s.bottomNav.backgroundColor, darkMode),
      borderTopColor: inkColor(s.bottomNav.borderTopColor, darkMode),
    }]}>
      {items.map(n => (
        <TouchableOpacity
          key={n.id}
          style={s.navBtn}
          onPress={() => onNav(n.id)}
          accessibilityLabel={n.label}
          accessibilityState={{ selected: active === n.id }}
        >
          <Text style={{ fontSize: 22 * fontScale, opacity: active === n.id ? 1 : 0.55 }}>{n.icon}</Text>
          <Text style={[
            s.navLabel,
            { color: inkColor(s.navLabel.color, darkMode), fontSize: 10 * fontScale },
            active === n.id ? s.navLabelActive : null,
          ]}>{n.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  bottomNav:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: 'rgba(8,8,15,0.97)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', flexDirection: 'row' },
  navBtn:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navLabel:       { fontSize: 10, color: 'rgba(255,255,255,0.38)' },
  navLabelActive: { color: '#a5d6a7', fontWeight: '700' },
});
