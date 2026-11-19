# assylbekussa-ui.github.io

Исходник сайта: `src/app.html`. Корень репозитория (index.html, work/, writing/, about/, contact/, resume/, 404.html, sitemap.xml, robots.txt) генерируется.

После любой правки в `src/app.html` перед коммитом:

    node tools/build.js

Скрипт открывает каждую страницу в Chromium (Playwright), сохраняет готовый HTML с title, description, canonical и og-тегами и обновляет sitemap.xml. Старые ссылки вида `/#/work/...` автоматически переводятся на `/work/...`.

Книга с перелистыванием (/book/) собирается отдельно: исходник в book-src/ (Vite + React, шаблон Biryani Legends от Kedhareswer Naidu, MIT): `cd book-src && npm i && npx vite build`, потом скопировать dist в папку book/.
