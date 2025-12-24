<?php
// 1. 性能与缓存控制：禁止浏览器缓存接口响应，确保每次随机
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Referrer-Policy: no-referrer');

// 配置设置
$category_dir = '../categories/'; 
$default_category = 'PC';
$fallback_image = 'https://previewengine.zoho.com.cn/image/WD/kpgnr3594a400711745ad934ebc7146c1059c';

// 2. 获取参数并打乱顺序
// 如果没有参数，直接使用默认；如果有参数，分割成数组
$cats = isset($_GET['category']) ? explode(',', $_GET['category']) : [$default_category];

// 随机打乱数组顺序，这样我们只需要找到“第一个存在的文件”即可
// 这比获取所有文件列表再取交集要快得多
shuffle($cats);

$target_file = null;

// 3. 高效查找文件 (替代原 scandir)
foreach ($cats as $cat) {
    // 安全过滤：去除空格，仅保留文件名，防止路径遍历攻击
    $cat = trim(basename($cat));
    if (empty($cat)) continue;

    $path = $category_dir . $cat . '.txt';
    
    // is_file 比 file_exists 稍微快一点点，且更准确
    if (is_file($path)) {
        $target_file = $path;
        break; // 找到一个能用的就立刻停止循环，极大提升速度
    }
}

// 4. 如果没找到有效分类，回退到默认分类
if (!$target_file) {
    $default_path = $category_dir . $default_category . '.txt';
    if (is_file($default_path)) {
        $target_file = $default_path;
    }
}

// 5. 读取链接并跳转
$redirect_url = $fallback_image;

if ($target_file) {
    // 读取文件内容到数组
    // FILE_IGNORE_NEW_LINES: 不读入换行符，省去后续 trim
    // FILE_SKIP_EMPTY_LINES: 跳过空行，省去后续 array_filter
    $lines = @file($target_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    if ($lines && count($lines) > 0) {
        // array_rand 获取随机键名，比 shuffle 整个大数组内存消耗更小
        $redirect_url = $lines[array_rand($lines)];
    }
}

// 执行跳转
header('Location: ' . trim($redirect_url));
exit;
?>
