const fs = require('fs');
const path = require('path');

// 1. 全局缓存，避免每次请求都读硬盘 (Serverless 热启动优化)
let cachedDb = null;

export default function handler(req, res) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // 仅允许 GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. 如果缓存为空，读取文件
    if (!cachedDb) {
      const filePath = path.join(process.cwd(), '../date.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      cachedDb = JSON.parse(fileContent);
    }

    // 3. 获取参数
    const { category, type } = req.query;
    
    // 4. 解析目标分类
    let targetCategories = [];
    if (category) {
      // 仅按英文逗号分割，trim 去除空格，filter(Boolean) 去除空项
      targetCategories = category.split(',').map(c => c.trim()).filter(Boolean);
    }

    // 5. 构建图片池
    let urlPool = [];
    
    for (const item of cachedDb) {
      // 匹配逻辑：
      // 如果 url 没有传 category 参数 -> isMatch = true (包含所有库)
      // 如果 url 传了参数 -> 检查 item.category 是否在 targetCategories 数组里
      const isMatch = targetCategories.length === 0 || targetCategories.includes(item.category);

      if (isMatch && Array.isArray(item.zids)) {
        for (const zid of item.zids) {
          // 拼接完整链接
          urlPool.push(item.baseUrl + zid);
        }
      }
    }

    // 6. 返回结果
    if (urlPool.length > 0) {
      // 随机取一张
      const randomUrl = urlPool[Math.floor(Math.random() * urlPool.length)];

      if (type === 'json') {
        // 返回 JSON 格式
        res.status(200).json({ 
          success: true, 
          url: randomUrl, 
          count: urlPool.length 
        });
      } else {
        // 直接重定向图片 (302)
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.redirect(302, randomUrl);
      }
    } else {
      // 404 处理：找不到对应分类的图片
      res.status(404).json({ 
        error: '未找到指定分类的图片', 
        message: '请检查 category 参数拼写是否正确',
        // 仅在开发/调试时返回可用分类，生产环境可视情况移除
        availableCategories: cachedDb.map(i => i.category) 
      });
    }

  } catch (error) {
    console.error('API Handler Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}