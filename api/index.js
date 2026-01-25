// 1. 使用 import 代替 require
// Vercel 的打包器支持直接 import JSON 文件
import db from '../date.json'; 

export default function handler(req, res) {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { category, type } = req.query;
    
    let targetCategories = [];
    if (category) {
      targetCategories = category.split(',').map(c => c.trim()).filter(Boolean);
    }

    let urlPool = [];
    
    // 遍历数据
    for (const item of db) {
      const isMatch = targetCategories.length === 0 || targetCategories.includes(item.category);

      if (isMatch && Array.isArray(item.zids)) {
        for (const zid of item.zids) {
          urlPool.push(item.baseUrl + zid);
        }
      }
    }

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
        error: '未找到指定分类的图片', 
        // 调试时可用，生产环境可移除
        availableCategories: db.map(i => i.category) 
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
}