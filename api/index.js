import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Axiom } from '@axiomhq/js';

// --- 全局缓存区 ---
// 分类索引：{ "原神": ["url1", "url2"], "PC": ["url3"] }
let categoryMap = null; 
// 所有图片的缓存池
let allUrlsCache = []; 

// 初始化 Axiom (放在外面避免重复创建)
const axiom = new Axiom({ token: process.env.AXIOM_TOKEN });

export default async function handler(req, res) {
  // CORS 和 仅允许 GET
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  // 性能计时开始
  const start = Date.now();

  try {
    // 1. 冷启动优化：只在第一次加载时读取并处理数据
    if (!categoryMap) {
      const filePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'date.json');
      const db = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      categoryMap = {};
      allUrlsCache = [];

      // 预处理：将数组转为哈希表 (Map)，极大提升后续查询速度
      for (const item of db) {
        if (!item.zids || !Array.isArray(item.zids)) continue;
        
        // 生成该分类下的所有完整链接
        const fullUrls = item.zids.map(zid => item.baseUrl + zid);
        
        // 存入全集
        allUrlsCache.push(...fullUrls);
        
        // 存入分类索引
        if (categoryMap[item.category]) {
          categoryMap[item.category].push(...fullUrls);
        } else {
          categoryMap[item.category] = fullUrls;
        }
      }
    }

    // 2. 快速获取参数
    const { category, type } = req.query;
    let resultPool = [];

    if (!category) {
      // 没传参数，直接用全集缓存 (无需计算)
      resultPool = allUrlsCache;
    } else {
      // 传了参数，直接查字典 (速度极快)
      const targets = category.split(','); // 简单分割，省去 map/filter 提升微小性能
      
      for (const cat of targets) {
        const cleanCat = cat.trim();
        if (cleanCat && categoryMap[cleanCat]) {
          resultPool.push(...categoryMap[cleanCat]);
        }
      }
    }

    // 3. 结果处理
    if (resultPool.length > 0) {
      const randomUrl = resultPool[Math.floor(Math.random() * resultPool.length)];
      
      // 4. 发送日志 (异步处理，捕捉错误防止影响主流程)
      const logData = {
        event: 'api_hit',
        cat: category || 'all',
        ip: req.headers['x-forwarded-for'],
        ua: req.headers['user-agent'],
        ms: Date.now() - start
      };
      // 发送到缓冲区，并确保刷新
      axiom.ingest(process.env.AXIOM_DATASET || 'vercel-logs', [logData]);
      await axiom.flush(); 

      // 5. 响应
      if (type === 'json') {
        res.status(200).json({ success: true, url: randomUrl });
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.redirect(302, randomUrl);
      }
    } else {
      // 404 情况
      res.status(404).json({ error: 'Not Found', available: Object.keys(categoryMap) });
    }

  } catch (error) {
    console.error(error);
    // 即使报错也尝试发一条错误日志
    try {
        axiom.ingest(process.env.AXIOM_DATASET || 'vercel-logs', [{ event: 'error', msg: error.message }]);
        await axiom.flush();
    } catch {}
    res.status(500).json({ error: 'Server Error' });
  }
}