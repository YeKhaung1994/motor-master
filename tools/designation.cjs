/**
 * Does this filename name this model?
 *
 * A designation is a sequence of letter/digit runs, matched with optional
 * separators and anchored by a trailing boundary. Leading context is irrelevant
 * ("KawasakiZ900" names a Z900), but a trailing alphanumeric changes the model:
 * "S 1000 R" must not match "S1000RR".
 *
 * Filenames often omit a trim badge, so a trailing badge may be dropped — but
 * only one from a known vocabulary. Dropping any trailing letter would let
 * "S 1000 R" fall back to "S 1000" and match the RR again.
 */
const TRIM = new Set([
  'se', 'sp', 'abs', 'dct', 'plus', 'pro', 'evo', 'special', 'limited', 'edition',
  'streetster', 'rally', 'adventure', 'touring', 'sport', 'std', 'standard', 'ultra',
]);

const deburr = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const runs = (s) => (deburr(s).toLowerCase().match(/[a-z]+|[0-9]+/g) ?? []);
const spaced = (s) =>
  deburr(s).toLowerCase().replace(/\.[a-z0-9]{3,4}$/, '').replace(/[^a-z0-9]+/g, ' ').trim();

function matchesParts(title, parts) {
  if (!parts.length || !parts.some((p) => /[0-9]/.test(p))) return false;
  return new RegExp(parts.join('\\s*') + '(?![a-z0-9])').test(spaced(title));
}

function confirms(title, model) {
  const paren = [...model.matchAll(/\((.*?)\)/g)].map((m) => m[1]);
  const outside = model.replace(/\(.*?\)/g, ' ');
  const alts = [...outside.split('/'), ...paren.flatMap((a) => a.split('/'))]
    .map((s) => s.trim()).filter(Boolean);

  for (const alt of alts) {
    let parts = runs(alt);
    if (matchesParts(title, parts)) return true;
    // Peel trailing trim badges only.
    while (parts.length > 1 && TRIM.has(parts[parts.length - 1])) {
      parts = parts.slice(0, -1);
      if (matchesParts(title, parts)) return true;
    }
  }
  return false;
}
module.exports = { confirms };
