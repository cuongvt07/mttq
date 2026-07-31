-- Sách demo để kiểm tra trình xem lật trang.
delete from public.books where slug = 'ban-tin-mat-tran-07-2026';

with b as (
  insert into public.books (title, slug, page_ratio)
  values ('Bản tin Mặt trận tháng 7/2026 — số 01', 'ban-tin-mat-tran-07-2026', '3:4')
  returning id
)
insert into public.book_pages (book_id, sort_order, background, elements)
select b.id, p.ord, p.bg, p.els::jsonb
from b, (values
  (0, '#cfe08a', '[
    {"id":"c1","type":"text","x":60,"y":80,"w":680,"rotation":0,"content":"UỶ BAN MẶT TRẬN TỔ QUỐC VIỆT NAM\nPHƯỜNG YÊN NGHĨA","fontSize":40,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#0b3f8f","bold":true,"italic":false,"align":"center","lineHeight":1.3},
    {"id":"c2","type":"image","x":100,"y":300,"w":600,"h":400,"rotation":0,"src":"/demo/hoat-dong-1.webp","radius":8,"opacity":1,"fit":"cover","borderWidth":0,"borderColor":"#ffffff"},
    {"id":"c3","type":"text","x":60,"y":760,"w":680,"rotation":0,"content":"BẢN TIN MẶT TRẬN THÁNG 7/2026\nSỐ 01","fontSize":34,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#c81e1e","bold":true,"italic":false,"align":"center","lineHeight":1.35}
  ]'),
  (1, '#ffffff', '[
    {"id":"p2a","type":"text","x":60,"y":70,"w":680,"rotation":0,"content":"Hoạt động nổi bật","fontSize":34,"fontFamily":"Georgia, \"Times New Roman\", serif","color":"#0b3f8f","bold":true,"italic":false,"align":"left","lineHeight":1.3},
    {"id":"p2b","type":"image","x":60,"y":150,"w":680,"h":420,"rotation":0,"src":"/demo/hoat-dong-2.webp","radius":10,"opacity":1,"fit":"cover","borderWidth":0,"borderColor":"#ffffff"},
    {"id":"p2c","type":"text","x":60,"y":600,"w":680,"rotation":0,"content":"Ra quân vệ sinh môi trường tại các khu dân cư, hưởng ứng phong trào toàn dân chung tay bảo vệ môi trường vì Thủ đô xanh – sạch – đẹp.","fontSize":24,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#14202e","bold":false,"italic":false,"align":"left","lineHeight":1.5}
  ]'),
  (2, '#ffffff', '[
    {"id":"p3a","type":"image","x":60,"y":80,"w":680,"h":450,"rotation":0,"src":"/demo/hoat-dong-3.webp","radius":10,"opacity":1,"fit":"cover","borderWidth":0,"borderColor":"#ffffff"},
    {"id":"p3b","type":"text","x":60,"y":560,"w":680,"rotation":0,"content":"Chăm lo an sinh xã hội","fontSize":32,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#0b3f8f","bold":true,"italic":false,"align":"left","lineHeight":1.3},
    {"id":"p3c","type":"text","x":60,"y":620,"w":680,"rotation":0,"content":"Thăm hỏi, tặng quà các gia đình có hoàn cảnh khó khăn trên địa bàn 15 tổ dân phố.","fontSize":24,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#14202e","bold":false,"italic":false,"align":"left","lineHeight":1.5}
  ]'),
  (3, '#0b3f8f', '[
    {"id":"p4a","type":"text","x":60,"y":420,"w":680,"rotation":0,"content":"UỶ BAN MTTQ VIỆT NAM\nPHƯỜNG YÊN NGHĨA","fontSize":36,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#ffffff","bold":true,"italic":false,"align":"center","lineHeight":1.4},
    {"id":"p4b","type":"text","x":60,"y":580,"w":680,"rotation":0,"content":"15 Ban Công tác Mặt trận tại 15 Tổ dân phố trực thuộc","fontSize":22,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#cfe0ff","bold":false,"italic":false,"align":"center","lineHeight":1.5}
  ]')
) as p(ord, bg, els);
