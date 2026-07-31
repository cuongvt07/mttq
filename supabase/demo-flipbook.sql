-- Gán flip-book demo cho 4 tin ở khối "Hoạt động chung" và 6 hoạt động của Ban Do Lộ.
-- Thay link thật trong /admin sau.
update public.media_items
set flipbook_url = 'https://heyzine.com/flip-book/a22e8f79e9.html';

update public.units
set flipbook_url = 'https://heyzine.com/flip-book/a22e8f79e9.html'
where cluster_id = (select id from public.clusters where slug = 'tdp-do-lo');
