// Génère les codes QR de la version express (fichiers fixes, publiés tels quels : aucune bibliothèque chargée sur le site).
// Usage : `npm run make:qr`. À relancer seulement si l'adresse change, et alors à réimprimer partout.
// Noir sur blanc, marge de 4 modules, correction d'erreur Q (25 %), sans logo : lisible même imprimé petit.
import QRCode from 'qrcode';
import { writeFile } from 'node:fs/promises';

const ADRESSE = 'https://fmichael.cloud/express';
const options = { errorCorrectionLevel: 'Q', margin: 4, color: { dark: '#000000', light: '#ffffff' } };

const svg = await QRCode.toString(ADRESSE, { ...options, type: 'svg' });
await writeFile('img/qr-express.svg', svg.endsWith('\n') ? svg : svg + '\n');
await QRCode.toFile('img/qr-express.png', ADRESSE, { ...options, type: 'png', width: 1000 });
console.log('Codes QR écrits dans img/ pour ' + ADRESSE);
