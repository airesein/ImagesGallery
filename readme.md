# ImagesGallery

使用php写的图片展示。存储图片的公链，然后展示出来，附带随机图片api

演示：旧版https://t.ziworld.top/index-v1.php
      v2 https://t.ziworld.top/

#  食用

依照下面配置后放入php环境中即可使用

## 创建分类

在**categories**文件夹中创建 **分类名.txt** 的文件(可以使用中文)

 **分类名.txt** 中存储图片公链链接，一行一个

## 配置

在**index.php**中第3行开始配置

```php
$CATEGORY_DIR = 'categories'; // 存放分类txt文件的目录

$SITE_TITLE = '图片公链存储'; // 网站标题 (此版本中不再直接显示)

$DEFAULT_CATEGORY = 'PC'; // 默认展示的分类

$THUMB_SIZE = 300; // 缩略图大小（主要用于Unsplash URL参数，非服务器端处理）
```

## api

**api/index.php**中第3行开始配置

```php
$category_dir = '../categories'; // 分类目录
$default_category = 'PC'; // 默认分类
```

使用：[说明文档 - 图片公链存储 API](https://t.ziworld.top/api/readme.html)

效果图：

![image-20250808172846563](assets/image-20250808172846563.png)


![image-20250808172925882](assets/image-20250808172925882.png)

![image-20250808172949213](assets/image-20250808172949213.png)


![image-20250808173039465](assets/image-20250808173039465.png)

---
## v2版本

优化了界面和加载速度，增添收藏等功能

![image-20250808173039465](assets/Snipaste_2025-12-22_00-17-27.png)



