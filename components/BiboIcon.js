import React from 'react';
import { Image } from 'react-native';

const BIBO_ICON = require('../assets/bibo/welcome.png');

/**
 * أيقونة بيبو الرسمية — تحل محل إيموجي رأس الطائر (🐦) في كل الأماكن
 * اللي بتُستخدم فيها كأيقونة/شعار مستقل (مش نص متدفق داخل جملة).
 */
export default function BiboIcon({ size = 20, style }) {
  return (
    <Image
      source={BIBO_ICON}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
