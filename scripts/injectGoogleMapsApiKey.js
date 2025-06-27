const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const manifestPath = path.resolve(__dirname, '../android/app/src/main/AndroidManifest.xml');
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.error('GOOGLE_MAPS_API_KEY não encontrada no .env.');
  process.exit(1);
}

let manifest = fs.readFileSync(manifestPath, 'utf8');

const metaTagRegex = /<meta-data[\s\S]*?android:name="com.google.android.geo.API_KEY"[\s\S]*?\/>/;
const metaTag = `    <meta-data android:name="com.google.android.geo.API_KEY" android:value="${apiKey}"/>`;

if (metaTagRegex.test(manifest)) {
  // Substitui a tag existente
  manifest = manifest.replace(metaTagRegex, metaTag);
} else {
  // Insere antes da primeira <activity>
  manifest = manifest.replace(/(<application[\s\S]*?>)/, `$1\n${metaTag}`);
}

fs.writeFileSync(manifestPath, manifest, 'utf8');
console.log('Chave do Google Maps injetada com sucesso no AndroidManifest.xml!'); 