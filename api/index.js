import path from 'path';
import { createRequire } from 'module';
import { Axiom } from '@axiomhq/js';
import { waitUntil } from '@vercel/functions';

const require = createRequire(import.meta.url);
const db = require('./date.json');

const categoryMap = {};
const allUrlsCache = [];

for (const item of db) {
  if (!item.zids || !Array.isArray(item.zids)) continue;
  const fullUrls = item.zids.map(zid => item.baseUrl + zid);
  allUrlsCache.push(...fullUrls);
  if (categoryMap[item.category]) {
    categoryMap[item.category].push(...fullUrls);
  } else {
    categoryMap[item.category] = fullUrls;
  }
}

const axiomToken = process.env.AXIOM_TOKEN;
const axiomDataset = process.env.AXIOM_DATASET || 'vercel-logs';
const axiom = axiomToken ? new Axiom({ token: axiomToken }) : null;
export default async function handler(req, res) {
  const start = Date.now();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { category, type } = req.query;
    let resultPool = [];
    if (!category) {
      resultPool = allUrlsCache;
    } else {
      const targets = category.split(',');
      for (const cat of targets) {
        const cleanCat = cat.trim();
        if (categoryMap[cleanCat]) {
          resultPool.push(...categoryMap[cleanCat]);
        }
      }
    }
    if (resultPool.length === 0) {
      res.status(404).json({ error: 'Not Found', available: Object.keys(categoryMap) });
      if (axiom) {
        waitUntil(
          axiom.ingest(axiomDataset, [{ event: 'not_found', cat: category }])
            .then(() => axiom.flush())
            .catch(console.error)
        );
      }
      return;
    }
    const randomUrl = resultPool[Math.floor(Math.random() * resultPool.length)];
    if (type === 'json') {
      res.status(200).json({ success: true, url: randomUrl });
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.redirect(302, randomUrl);
    }
    if (axiom) {
      const logTask = async () => {
        try {
          const logData = {
            event: 'api_hit',
            cat: category || 'all',
            ip: req.headers['x-forwarded-for'],
            ua: req.headers['user-agent'],
            ms: Date.now() - start 
          };
          axiom.ingest(axiomDataset, [logData]);
          await axiom.flush();
        } catch (err) {
          console.error('Log error:', err);
        }
      };
      waitUntil(logTask());
    }

  } catch (error) {
    console.error('API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server Error' });
    }
  }
}