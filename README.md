[README.md](https://github.com/user-attachments/files/31898778/README.md)
# Ruslan AI Visual Portfolio

Статический сайт-портфолио на чистых HTML, CSS и JavaScript. Сайт рассчитан на публикацию через GitHub Pages.

## Структура

- `index.html` — основной интерфейс;
- `assets/styles.css` — стили, темы и адаптивность;
- `assets/scripts.js` — навигация, поиск, фильтры и папки;
- `data/projects.json` — данные проектов;
- `about_me/content_ru.md` — текст раздела «Обо мне»;
- `offer/content_ru.md` — коммерческое предложение;
- `projects/` — место для изображений и видео.

## Публикация на GitHub Pages

1. Загрузите все файлы и папки в корень репозитория.
2. Откройте репозиторий на GitHub и перейдите в **Settings → Pages**.
3. В разделе **Build and deployment** выберите **Deploy from a branch**.
4. Выберите ветку `main` и папку `/ (root)`, затем нажмите **Save**.
5. Через некоторое время GitHub выдаст адрес сайта.

## Как добавить проекты

Добавьте новый объект в `data/projects.json`. Для изображений позже можно использовать, например, `projects/creativity/image-01.jpg`, а затем подключить их в карточках через поле `images`.

## Локальный запуск

Из-за загрузки `projects.json` через `fetch` сайт лучше запускать локальным сервером:

```bash
python3 -m http.server 8000
```

Затем откройте `http://localhost:8000`.

Сайт не использует платные сервисы, сборщик или серверную базу данных.
