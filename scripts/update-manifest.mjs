import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = `${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}/api/settings/web`;

// Helper to download image and save locally
async function downloadAndSaveImage(url, filename) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(path.join(__dirname, '../public', filename), Buffer.from(response.data));
    return `/${filename}`;
  } catch (err) {
    console.error(`Error fetching image ${url}:`, err.message);
    return '/default-logo.png';
  }
}

async function updateManifest() {
  try {
    console.log('Fetching web settings from API...');

    const res = await axios.get(API_URL, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.data.success || !res.data.data) {
      throw new Error('Failed to fetch settings from API');
    }

    const webSettings = res.data.data.value;

    // Download PWA logos and save locally
    const icon144 = webSettings.pwaLogo144x144
      ? await downloadAndSaveImage(webSettings.pwaLogo144x144, 'logo-144.png')
      : '/default-logo.png';
    const icon192 = webSettings.pwaLogo192x192
      ? await downloadAndSaveImage(webSettings.pwaLogo192x192, 'logo-192.png')
      : '/default-logo.png';
    const icon512 = webSettings.pwaLogo512x512
      ? await downloadAndSaveImage(webSettings.pwaLogo512x512, 'logo-512.png')
      : '/default-logo.png';

    const manifestContent = {
      name: webSettings.pwaName || webSettings.siteName || 'Hyper Local',
      short_name: webSettings.pwaName || webSettings.siteName || 'Hyper Local',
      description:
        webSettings.pwaDescription ||
        webSettings.shortDescription ||
        'A Progressive Web App for goods ordering and delivery',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      orientation: 'portrait',
      icons: [
        { src: icon144, sizes: '144x144', type: 'image/png' },
        { src: icon192, sizes: '192x192', type: 'image/png' },
        { src: icon512, sizes: '512x512', type: 'image/png' },
      ],
    };

    const manifestPath = path.join(__dirname, '../public/manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifestContent, null, 2), 'utf8');

    console.log('Successfully updated manifest.json with latest PWA settings');
  } catch (error) {
    console.error('Error updating manifest:', error.message);
    console.log('Build will continue with existing manifest.json');
  }
}

updateManifest();
