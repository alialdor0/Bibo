// index.js
// نقطة دخول التطبيق. بدل الاعتماد على node_modules/expo/AppEntry.js (المسار القديم)،
// بنسجّل المكوّن الرئيسي بنفسنا — ده الأسلوب الرسمي الثابت عبر كل إصدارات Expo SDK.
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
