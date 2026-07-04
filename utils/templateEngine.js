// utils/templateEngine.js
// استبدال متغيرات المستخدم ({{user_name}}, {{user_city}}, ...) بالبيانات
// الفعلية، في أي نص أو أي بنية بيانات متداخلة (كائنات/مصفوفات).

const TOKEN_RE = /\{\{\s*(\w+)\s*\}\}/g;

/** يبني كائن المتغيرات من بيانات المستخدم في الـ context */
export function buildTemplateVars(user) {
  const u = user || {};
  return {
    user_name:       (u.firstName || u.fullName || 'Friend').trim(),
    user_full_name:  (u.fullName || u.firstName || 'Friend').trim(),
    user_city:       (u.customCity || u.city || '').trim(),
    user_country:    (u.customCountry || u.country || '').trim(),
    user_profession: (u.customJob || u.job || '').trim(),
  };
}

/** يستبدل كل {{token}} بقيمته في نص واحد. توكن مش موجود في vars بيفضل زي ما هو. */
export function fillTemplate(text, vars) {
  if (typeof text !== 'string') return text;
  return text.replace(TOKEN_RE, (match, key) => (vars[key] !== undefined && vars[key] !== '') ? vars[key] : match);
}

/** بيمشي جوه أي object/array/string ويستبدل كل التوكنز، من غير ما يلمس أرقام/booleans */
export function fillDeep(node, vars) {
  if (typeof node === 'string') return fillTemplate(node, vars);
  if (Array.isArray(node)) return node.map(item => fillDeep(item, vars));
  if (node && typeof node === 'object') {
    const out = {};
    for (const key of Object.keys(node)) out[key] = fillDeep(node[key], vars);
    return out;
  }
  return node;
}
