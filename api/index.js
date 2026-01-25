import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Axiom } from '@axiomhq/js';

// --- 全局缓存区 ---
let categoryMap = null; 
let allUrlsCache = []; 

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const start = Date.now();

  try {
    // 1. 在函数内部读取 Token，确保环境变量已加载
    const axiomToken = process.env.AXIOM_TOKEN;
    const axiomDataset = process.env.AXIOM_DATASET || 'vercel-logs';

    // 2. 调试日志 (如果报错，去 Vercel Logs 看这一行)
    if (!axiomToken) {
      console.error('❌ 严重错误: AXIOM_TOKEN 环境变量未找到！日志将无法发送。');
    }

    // 3. 业务逻辑：加载数据
    if (!categoryMap) {
      const filePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'date.json');
      const db = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      categoryMap = {};
      allUrlsCache = [];

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
    }

    // 4. 处理请求
    const { category, type } = req.query;
    let resultPool = [];

    if (!category) {
      resultPool = allUrlsCache;
    } else {
      const targets = category.split(',');
      for (const cat of targets) {
        const cleanCat = cat.trim();
        if (cleanCat && categoryMap[cleanCat]) {
          resultPool.push(...categoryMap[cleanCat]);
        }
      }
    }

    // 5. 返回结果与日志发送
    if (resultPool.length > 0) {
      const randomUrl = resultPool[Math.floor(Math.random() * resultPool.length)];
      
      // 只有当 Token 存在时才初始化 Axiom 并发送日志
      if (axiomToken) {
        const axiom = new Axiom({ token: axiomToken });
        const logData = {
          event: 'api_hit',
          cat: category || 'all',
          ip: req.headers['x-forwarded-for'],
          ua: req.headers['user-agent'],
          ms: Date.now() - start
        };
        // 使用 ingest (非 raw)
        axiom.ingest(axiomDataset, [logData]);
        // 必须等待 flush
        await axiom.flush();
      }

      if (type === 'json') {
        res.status(200).json({ success: true, url: randomUrl });
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.redirect(302, randomUrl);
      }
    } else {
      // 404
      if (axiomToken) {
          const axiom = new Axiom({ token: axiomToken });
          axiom.ingest(axiomDataset, [{ event: 'not_found', cat: category }]);
          await axiom.flush();
      }
      res.status(404).json({ error: 'Not Found', available: Object.keys(categoryMap) });
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
}