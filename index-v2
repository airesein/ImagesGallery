<?php
// 开启GZIP压缩，显著减少传输体积
if(extension_loaded('zlib')){ob_start('ob_gzhandler');}

// ================= 配置区域 =================
$txtFolder = 'categories/';
$aboutUrl = 'https://github.com/yourname/gallery'; 
// ===========================================

// 代理下载
if(isset($_GET['download']) && filter_var($u=$_GET['download'], FILTER_VALIDATE_URL)){
    $f=basename(parse_url($u,PHP_URL_PATH)?:'dl.jpg');
    if(!strpos($f,'.'))$f='img_'.time().'.jpg';
    header('Content-Type: application/octet-stream');
    header("Content-Disposition: attachment; filename=\"$f\"");
    readfile($u); exit;
}

// 读取分类
if(!file_exists($txtFolder)) mkdir($txtFolder,0777,true);
$cats=[]; foreach(glob($txtFolder.'*.txt') as $f) $cats[]=['n'=>basename($f,'.txt'),'f'=>basename($f)];
$cur = $_GET['cat'] ?? ($cats[0]['n']??'');
$isFav = $cur==='favorites';
$imgs=[];
if(!$isFav && $cur && file_exists($t=$txtFolder.$cur.'.txt')) 
    $imgs = array_filter(array_map('trim', file($t, FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES)));
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>画廊展示</title>
<style>
:root{--gb:rgba(255,255,255,0.1);--gbr:rgba(255,255,255,0.15);--txt:#fff;--act:rgba(255,255,255,0.25);--sw:260px;--hc:#ff4757}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:linear-gradient(135deg,#1a2a6c,#b21f1f,#fdbb2d);background-size:400% 400%;animation:gBG 15s ease infinite;min-height:100vh;color:var(--txt);overflow-x:hidden;user-select:none;-webkit-user-select:none}
img{-webkit-user-drag:none;pointer-events:none}
::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:rgba(0,0,0,0.1)}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.4);border-radius:4px}
@keyframes gBG{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.glass{background:var(--gb);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--gbr)}
.layout{display:flex;min-height:100vh}
.sb{width:var(--sw);height:100vh;position:fixed;left:0;top:0;overflow-y:auto;z-index:100;padding:30px 0;display:flex;flex-direction:column;border-right:1px solid var(--gbr)}
.st{font-size:1.8rem;font-weight:800;padding:0 20px 30px;text-shadow:0 2px 10px rgba(0,0,0,0.2)}
.nl{list-style:none;width:100%}
.ns{height:1px;background:rgba(255,255,255,0.2);margin:15px 20px}
.nk{display:flex;align-items:center;padding:16px 25px;color:rgba(255,255,255,0.7);text-decoration:none;font-size:1.05rem;transition:0.3s;border-left:4px solid transparent;cursor:pointer}
.nk:hover{color:#fff;background:rgba(255,255,255,0.05);padding-left:30px}
.nk.active{color:#fff;background:var(--act);border-left-color:#fff;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.1)}
.mc{margin-left:var(--sw);width:calc(100% - var(--sw));min-height:100vh;padding:30px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:20px}
.ic{position:relative;border-radius:12px;overflow:hidden;background:rgba(0,0,0,0.2);transition:transform 0.3s;cursor:zoom-in;aspect-ratio:4/3;box-shadow:0 8px 20px rgba(0,0,0,0.2)}
.ic:hover{transform:translateY(-5px) scale(1.02);z-index:2;box-shadow:0 15px 30px rgba(0,0,0,0.4)}
.ic img{width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity 0.5s}
.ic img.loaded{opacity:1}
.fb{position:absolute;top:10px;right:10px;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.3);backdrop-filter:blur(5px);display:flex;justify-content:center;align-items:center;cursor:pointer;z-index:10;transition:0.2s;border:1px solid rgba(255,255,255,0.1)}
.fb::before{content:'❤';font-size:20px;color:rgba(255,255,255,0.7);transition:0.2s}
.fb:hover{background:rgba(255,255,255,0.2);transform:scale(1.1)}
.fb.active{background:rgba(255,255,255,0.9)}.fb.active::before{color:var(--hc);transform:scale(1.1)}
.sp{height:80px}
@media(max-width:768px){.layout{flex-direction:column}.sb{position:sticky;width:100%;height:auto;padding:12px 5px;flex-direction:row;align-items:center;border-right:0;border-bottom:1px solid var(--gbr);background:rgba(255,255,255,0.1)}.st{display:none}.nl{display:flex;overflow-x:auto;padding:0 5px;gap:8px;scrollbar-width:none;-ms-overflow-style:none}.nl::-webkit-scrollbar{display:none}.ns{width:1px;height:24px;margin:0 5px;flex-shrink:0;background:rgba(255,255,255,0.3)}.nk{padding:8px 18px;border-radius:20px;border:0;font-size:0.9rem;background:rgba(0,0,0,0.2);white-space:nowrap}.nk.active{background:#fff;color:#333}.mc{margin:0;width:100%;padding:15px}.grid{grid-template-columns:1fr}}
.lb{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:1000;flex-direction:column;justify-content:center;align-items:center;opacity:0;transition:0.3s}
.lb.active{display:flex;opacity:1}
.lbc{position:relative;max-width:100%;max-height:80vh;display:flex;justify-content:center}
.lb img{max-width:95%;max-height:80vh;border-radius:8px;box-shadow:0 0 50px rgba(0,0,0,0.5);object-fit:contain;pointer-events:auto;cursor:zoom-out}
.lbx{position:absolute;top:20px;right:20px;width:44px;height:44px;background:rgba(255,255,255,0.15);border-radius:50%;text-align:center;line-height:44px;color:#fff;font-size:28px;cursor:pointer;z-index:1002}
.lbs{margin-top:25px;display:flex;gap:25px;z-index:1002}
.cbtn{display:inline-flex;align-items:center;justify-content:center;width:55px;height:55px;background:rgba(255,255,255,0.1);backdrop-filter:blur(15px);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:50%;cursor:pointer;transition:0.3s;outline:0}
.cbtn svg{width:24px;height:24px;fill:currentColor}
.cbtn:hover{background:rgba(255,255,255,0.3);transform:translateY(-3px) scale(1.1)}
#tst{visibility:hidden;min-width:200px;background:rgba(0,0,0,0.8);backdrop-filter:blur(5px);color:#fff;text-align:center;border-radius:50px;padding:16px;position:fixed;z-index:2000;left:50%;bottom:100px;transform:translateX(-50%);opacity:0;transition:0.3s}
#tst.show{visibility:visible;opacity:1;bottom:110px}
.et{text-align:center;padding-top:100px;color:rgba(255,255,255,0.6);font-size:1.2rem;grid-column:1/-1}
</style>
</head>
<body>
<div class="layout">
<aside class="sb glass">
<div class="st">GALLERY</div>
<ul class="nl">
<li><a href="?cat=favorites" class="nk <?=$isFav?'active':''?>">❤️ 我的收藏</a></li>
<li><a href="<?=htmlspecialchars($aboutUrl)?>" target="_blank" class="nk">ℹ️ 关于 & API</a></li>
<div class="ns"></div>
<?php if(!$cats):?><li style="padding:15px;text-align:center;color:#fff8">暂无分类</li><?php else:foreach($cats as $c):?>
<li><a href="?cat=<?=urlencode($c['n'])?>" class="nk <?=($cur==$c['n'])?'active':''?>"><?=htmlspecialchars($c['n'])?></a></li>
<?php endforeach;endif;?>
</ul>
</aside>
<main class="mc">
<h2 style="margin-bottom:20px;padding-left:5px;border-left:4px solid #fff;line-height:1"><?=$isFav?'我的收藏':($cur?:'画廊')?></h2>
<div class="grid" id="grid">
<?php if(!$isFav && $imgs): foreach($imgs as $u):?>
<div class="ic" data-src="<?=htmlspecialchars($u)?>"><img src="<?=htmlspecialchars($u)?>" loading="lazy" onload="this.classList.add('loaded')"><div class="fb" title="收藏"></div></div>
<?php endforeach; elseif(!$isFav):?><div class="et">该分类下暂无图片</div><?php endif;?>
</div><div class="sp"></div>
</main>
</div>
<div id="lb" class="lb">
<div class="lbx">&times;</div>
<div class="lbc"><img id="lbi" src=""></div>
<div class="lbs">
<button class="cbtn" id="bdl" title="下载"><svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg></button>
<button class="cbtn" id="bcp" title="复制"><svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button>
<button class="cbtn" id="bop" title="新窗口"><svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg></button>
</div>
</div>
<div id="tst"></div>
<script>
const isFav=<?=$isFav?'true':'false'?>,grid=document.getElementById('grid'),lb=document.getElementById('lb'),lbi=document.getElementById('lbi'),tst=document.getElementById('tst');
let cUrl='';
const getF=()=>JSON.parse(localStorage.getItem('myGalleryFavs')||'[]'),setF=f=>localStorage.setItem('myGalleryFavs',JSON.stringify(f));
const msg=m=>{tst.innerText=m;tst.className='show';setTimeout(()=>tst.className='',2000)};

// 事件委托：性能优化的关键
grid.addEventListener('click', e => {
    const c = e.target.closest('.ic');
    if(!c) return;
    const u = c.dataset.src;
    const fb = e.target.closest('.fb');
    // 点击收藏按钮
    if(fb) {
        e.stopPropagation();
        let fs=getF(), i=fs.indexOf(u), add=i===-1;
        add ? fs.push(u) : fs.splice(i,1);
        if(add) fb.classList.add('active'); else fb.classList.remove('active');
        if(!add && isFav) {
            c.style.cssText='transform:scale(0);opacity:0';
            setTimeout(()=>{c.remove();if(!getF().length) renF()},300);
        }
        setF(fs);
        if(!isFav) msg(add?"❤️ 已收藏":"💔 已取消收藏");
    } else {
        // 点击图片预览
        cUrl=u; lbi.src=u; lb.classList.add('active'); document.body.style.overflow='hidden';
    }
});

// 渲染收藏 (使用innerHTML一次性渲染，减少回流)
const renF=()=>{
    const fs=getF();
    if(!fs.length) return grid.innerHTML='<div class="et">还没有收藏任何图片<br>点击图片右上角的爱心收藏</div>';
    grid.innerHTML = fs.map(u=>`<div class="ic" data-src="${u}"><img src="${u}" loading="lazy" onload="this.classList.add('loaded')"><div class="fb active" title="取消收藏"></div></div>`).join('');
};

// 状态同步
const upS=()=>{
    const fs=getF();
    document.querySelectorAll('.ic').forEach(c=>{
        if(fs.includes(c.dataset.src)) c.querySelector('.fb')?.classList.add('active');
    });
};

document.addEventListener('DOMContentLoaded', ()=>{ if(isFav) renF(); else upS(); });

// 灯箱操作
const hideLb=()=>{lb.classList.remove('active');document.body.style.overflow='';setTimeout(()=>lbi.src='',300)};
lb.addEventListener('click',e=>{if(e.target===lb||e.target.closest('.lbx')||e.target===lbi) hideLb()});
document.getElementById('bdl').onclick=e=>{
    e.stopPropagation(); if(!cUrl)return; msg("⏳ 正在下载...");
    const a=document.createElement('a'); a.href='?download='+encodeURIComponent(cUrl); a.style.display='none';
    document.body.appendChild(a); a.click(); a.remove();
};
document.getElementById('bcp').onclick=e=>{
    e.stopPropagation(); if(!cUrl)return;
    navigator.clipboard.writeText(cUrl).then(()=>msg("✅ 链接已复制")).catch(()=>{
        const t=document.createElement('textarea');t.value=cUrl;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();msg("✅ 链接已复制");
    });
};
document.getElementById('bop').onclick=e=>{e.stopPropagation();if(cUrl)window.open(cUrl,'_blank')};
</script>
</body>
</html>
