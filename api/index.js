import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. 设置缓存变量，防止每次请求都读文件（提升性能）
let cachedDb = null;

export default function handler(req, res) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. 读取数据 (绕过 import，直接读文本)
    if (!cachedDb) {
      // 获取当前文件的绝对路径 (兼容 ESM 模式)
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      
      // 拼接 json 文件路径
      const filePath = path.join(__dirname, 'date.json');
      
      // 读取并解析
      const fileContent = fs.readFileSync(filePath, 'utf8');
      cachedDb = JSON.parse(fileContent);
    }

    // 3. 获取参数
    const { category, type } = req.query;
    
    // 4. 解析目标分类
    let targetCategories = [];
    if (category) {
      targetCategories = category.split(',').map(c => c.trim()).filter(Boolean);
    }

    // 5. 筛选逻辑
    let urlPool = [];
    for (const item of cachedDb) {
      const isMatch = targetCategories.length === 0 || targetCategories.includes(item.category);

      if (isMatch && Array.isArray(item.zids)) {
        for (const zid of item.zids) {
          urlPool.push(item.baseUrl + zid);
        }
      }
    }

    // 6. 返回结果
    if (urlPool.length > 0) {
      const randomUrl = urlPool[Math.floor(Math.random() * urlPool.length)];

      if (type === 'json') {
        res.status(200).json({ 
          success: true, 
          url: randomUrl, 
          count: urlPool.length 
        });
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.redirect(302, randomUrl);
      }
    } else {
      res.status(404).json({ 
        error: '未找到指定分类的资源', 
        availableCategories: cachedDb.map(i => i.category) 
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    // 如果发生错误，返回详细信息以便调试
    res.status(500).json({ 
      error: 'Server Error', 
      details: error.message 
    });
  }
}