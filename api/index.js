import { createRequire } from 'module';
import { Axiom } from '@axiomhq/js';
import { waitUntil } from '@vercel/functions';

const require = createRequire(import.meta.url);
const db = require('./date.json');

// --- 预处理数据 (仅在冷启动时执行一次) ---
const categoryMap = {};
const allUrlsCache = [];

for (const item of db) {
  if (!item.zids || !Array.isArray(item.zids)) continue;
  
  const fullUrls = item.zids.map(zid => `${item.baseUrl}${zid}`);
  allUrlsCache.push(...fullUrls);
  
  const cat = item.category || 'default';
  if (!categoryMap[cat]) categoryMap[cat] = [];
  categoryMap[cat].push(...fullUrls);
}

const axiomToken = process.env.AXIOM_TOKEN;
const axiomDataset = process.env.AXIOM_DATASET || 'vercel-logs';
const axiom = axiomToken ? new Axiom({ token: axiomToken }) : null;

export default async function handler(req, res) {
  const start = Date.now();
  
  // 跨域设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  // 获取调用方信息
  const referer = req.headers['referer'] || ''; // 包含完整 URL
  const origin = req.headers['origin'] || '';   // 仅包含协议和域名
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const { category, type } = req.query;
    let resultPool = [];

    // 筛选池子
    if (!category) {
      resultPool = allUrlsCache;
    } else {
      const targets = category.split(',').map(c => c.trim());
      for (const cat of targets) {
        if (categoryMap[cat]) {
          resultPool.push(...categoryMap[cat]);
        }
      }
    }

    // 404 处理
    if (resultPool.length === 0) {
      res.status(404).json({ 
        error: 'Not Found', 
        available: Object.keys(categoryMap),
        referer: referer // 返回给客户端调试用（可选）
      });
      
      logToAxiom({ event: 'not_found', category, referer, origin, ip });
      return;
    }

    // 随机选择
    const randomUrl = resultPool[Math.floor(Math.random() * resultPool.length)];

    // 响应逻辑
    if (type === 'json') {
      res.status(200).json({ success: true, url: randomUrl });
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.redirect(302, randomUrl);
    }

    // 统计调用耗时与来源
    logToAxiom({
      event: 'api_hit',
      category: category || 'all',
      url: randomUrl,
      referer,
      origin,
      ip,
      ua: userAgent,
      ms: Date.now() - start
    });

  } catch (error) {
    console.error('API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server Error' });
    }
  }

  // 辅助函数：异步日志发送（不阻塞主响应）
  function logToAxiom(data) {
    if (!axiom) return;
    
    const task = async () => {
      try {
        // 尝试从 referer 提取简洁的 hostname 方便统计
        let sourceHost = 'direct';
        if (data.referer) {
          try { sourceHost = new URL(data.referer).hostname; } catch (e) {}
        } else if (data.origin) {
          try { sourceHost = new URL(data.origin).hostname; } catch (e) {}
        }

        await axiom.ingest(axiomDataset, [{ ...data, sourceHost }]);
        await axiom.flush();
      } catch (err) {
        console.error('Axiom Log Error:', err);
      }
    };

    waitUntil(task());
  }
}
