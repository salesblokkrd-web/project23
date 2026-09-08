import re, io
p = "index.html"
s = open(p, encoding="utf-8").read()

OLD = '(function(){var v=document.querySelector(".bgvid");if(v&&matchMedia("(orientation:portrait)").matches){v.src="/intro/intro-bg-m.mp4";v.poster="/intro/intro-poster-m.jpg";v.load();if(v.play)v.play().catch(function(){});}})();'

NEW = ('(function(){var v=document.querySelector(".bgvid");if(!v)return;'
       'if(matchMedia("(orientation:portrait),(max-width:768px)").matches){'
       'v.src="/intro/intro-bg-m.mp4";v.poster="/intro/intro-poster-m.jpg";}'
       'v.muted=true;v.setAttribute("playsinline","");'
       'function p(){try{var r=v.play();if(r&&r.catch)r.catch(function(){});}catch(e){}}'
       'v.addEventListener("canplay",p);v.addEventListener("loadeddata",p);'
       'v.load();p();})();')

assert OLD in s, "старый скрипт не найден — не патчу вслепую"
s = s.replace(OLD, NEW)
# preload auto -> metadata на видео (быстрее старт на медленном инете; play по canplay всё равно сыграет)
s = s.replace('preload="auto"', 'preload="metadata"')
open(p, "w", encoding="utf-8").write(s)
print("патч применён: надёжный play (по canplay/loadeddata) + мобильный триггер шире + preload=metadata")
