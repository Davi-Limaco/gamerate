USE gamerate;

UPDATE jogo SET capa = CASE id_jogo
  WHEN 1 THEN 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp'
  WHEN 2 THEN 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.webp'
  WHEN 3 THEN 'https://imgs.search.brave.com/ZubJditS635fhXh90xqa0-kMrVIINpIVtWC5Y1OeI1U/rs:fit:200:200:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZS5hcGkucGxheXN0/YXRpb24uY29tL3Z1/bGNhbi9hcC9ybmQv/MjAyMzAyLzIzMjEv/YmE3MDZlNTRkNjhk/MTBhMGViNmFiN2Mz/NmNkYWQ5MTc4YzU4/YjdmYjdiYjAzZDI4/LnBuZw'
  WHEN 4 THEN 'https://www.cyberpunk.net/build/images/home8/product-cp77@1x-5cf31fe8.jpg'
  WHEN 5 THEN 'https://imgproxy.eneba.games/AbaLDIifgZoTv5QFDMc0pU5a7emTcOicKEiN98yIrz0/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy9x/N2ktbXNpS0p3OEE3/M0llTEt0WXV3cHIw/aWx3NjJOV1NWUUlG/RDBHYkIwLmpwZWc'
  WHEN 6 THEN 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.webp'
  WHEN 7 THEN 'https://imgs.search.brave.com/wsQxG-PKveEiNyz0oU5HgRktltvPmnf0BM9XGB6TldM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL00v/TVY1Qk0yUTJZalJp/Wm1NdE9EbGtNeTAw/WmpjM0xXSXlZVGt0/T1dNM1pEYzRZekky/WVRZd1hrRXlYa0Zx/Y0djQC5qcGc'
  WHEN 8 THEN 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.webp'
END
WHERE id_jogo BETWEEN 1 AND 8;