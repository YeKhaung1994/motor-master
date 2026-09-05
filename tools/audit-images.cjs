#!/usr/bin/env node
/**
 * Checks that every catalogue photo names the model it is attached to.
 *
 * Filename matching cannot prove a photograph depicts the right bike — it only
 * catches the errors that leave a trace in the name. Photos it cannot confirm
 * are listed for a person to look at, not deleted.
 *
 *   node tools/audit-images.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const { confirms } = require('./designation.cjs');

const seedDir = path.join(__dirname, '..', 'apps', 'api', 'src', 'db', 'seed');
const bikesDir = path.join(__dirname, '..', 'apps', 'web', 'public', 'bikes');

const slug = (...parts) =>
  parts.join(' ').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const models = {};
for (const file of fs.readdirSync(seedDir).filter((f) => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(seedDir, file), 'utf8'));
  for (const m of data.models) {
    models[slug(data.brand, m.model)] = { brand: data.brand, model: m.model, year: m.model_year };
  }
}

const credits = JSON.parse(fs.readFileSync(path.join(bikesDir, 'credits.json'), 'utf8'));
const onDisk = new Set(
  fs.readdirSync(bikesDir).filter((f) => f.endsWith('.jpg')).map((f) => f.replace(/\.jpg$/, '')),
);

const problems = { missingFile: [], orphanFile: [], unconfirmed: [], vintage: [] };

for (const credit of credits) {
  const entry = models[credit.slug];
  if (!onDisk.has(credit.slug)) problems.missingFile.push(credit.slug);
  if (!entry) continue;

  if (!confirms(credit.title, entry.model)) {
    problems.unconfirmed.push(`${entry.brand} ${entry.model} -> ${credit.title}`);
  }
  const years = [...credit.title.matchAll(/\b(19\d\d|20[0-3]\d)\b/g)].map((m) => Number(m[1]));
  if (years.length && Math.max(...years) < entry.year - 20) {
    problems.vintage.push(`${entry.brand} ${entry.model} -> ${credit.title}`);
  }
}
const credited = new Set(credits.map((c) => c.slug));
for (const file of onDisk) if (!credited.has(file)) problems.orphanFile.push(file);

console.log(`models     ${Object.keys(models).length}`);
console.log(`photos     ${onDisk.size}`);
console.log(`credited   ${credits.length}`);
for (const [name, list] of Object.entries(problems)) {
  console.log(`\n${name}: ${list.length}`);
  list.forEach((l) => console.log(`  ${l}`));
}
const fatal = problems.missingFile.length + problems.orphanFile.length + problems.vintage.length;
process.exit(fatal ? 1 : 0);
