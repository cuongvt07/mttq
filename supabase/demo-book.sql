-- ============================================================================
-- Sách demo: Bản tin Mặt trận tháng 7/2026 — số 01
-- Bảng màu: xanh cờ #0b3f8f · đỏ #c81e1e · vàng kim #ffd24a · chữ nội dung #1f2937
-- Cỡ chữ đặt cho khung 800×1067 (tỉ lệ 3:4) để đọc thoải mái khi thu nhỏ.
-- Chạy lại nhiều lần vẫn an toàn.
-- ============================================================================

delete from public.books where slug = 'ban-tin-mat-tran-07-2026';

with b as (
  insert into public.books (title, slug, page_ratio, chrome)
  values (
    'Bản tin Mặt trận tháng 7/2026 — số 01',
    'ban-tin-mat-tran-07-2026',
    '3:4',
    '{
      "margin": 52,
      "skipFirstPage": true,
      "header": {
        "enabled": true,
        "text": "UỶ BAN MTTQ VIỆT NAM PHƯỜNG YÊN NGHĨA",
        "align": "center",
        "fontSize": 20,
        "color": "#0b3f8f",
        "rule": true,
        "ruleColor": "#c81e1e",
        "ruleWidth": 3
      },
      "footer": {
        "enabled": true,
        "text": "Bản tin số 01 · tháng 7/2026",
        "align": "left",
        "fontSize": 19,
        "color": "#0b3f8f",
        "rule": true,
        "ruleColor": "#ffd24a",
        "ruleWidth": 3,
        "pageNumber": true,
        "pageNumberAlign": "right"
      }
    }'::jsonb
  )
  returning id
)
insert into public.book_pages (book_id, sort_order, background, elements)
select b.id, p.ord, p.bg, p.els::jsonb
from b, (values

  -- ------------------------------------------------------------------- bìa --
  (0, '#0b3f8f', '[
    {"id":"c1","type":"text","x":60,"y":70,"w":680,"rotation":0,
     "content":"UỶ BAN MẶT TRẬN TỔ QUỐC VIỆT NAM\nPHƯỜNG YÊN NGHĨA",
     "fontSize":46,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#ffffff",
     "bold":true,"italic":false,"align":"center","lineHeight":1.25},
    {"id":"c2","type":"image","x":70,"y":300,"w":660,"h":440,"rotation":0,
     "src":"/demo/hoat-dong-1.webp","radius":14,"opacity":1,"fit":"cover",
     "borderWidth":6,"borderColor":"#ffd24a"},
    {"id":"c3","type":"text","x":60,"y":790,"w":680,"rotation":0,
     "content":"BẢN TIN MẶT TRẬN\nTHÁNG 7/2026 — SỐ 01",
     "fontSize":48,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#ffd24a",
     "bold":true,"italic":false,"align":"center","lineHeight":1.25}
  ]'),

  -- --------------------------------------------------------------- trang 2 --
  (1, '#ffffff', '[
    {"id":"p2a","type":"text","x":52,"y":128,"w":696,"rotation":0,
     "content":"HOẠT ĐỘNG NỔI BẬT",
     "fontSize":46,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#c81e1e",
     "bold":true,"italic":false,"align":"left","lineHeight":1.2},
    {"id":"p2b","type":"image","x":52,"y":210,"w":696,"h":430,"rotation":0,
     "src":"/demo/hoat-dong-2.webp","radius":12,"opacity":1,"fit":"cover",
     "borderWidth":0,"borderColor":"#ffffff"},
    {"id":"p2c","type":"text","x":52,"y":665,"w":696,"rotation":0,
     "content":"Ra quân vệ sinh môi trường tại các khu dân cư",
     "fontSize":32,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#0b3f8f",
     "bold":true,"italic":false,"align":"left","lineHeight":1.3},
    {"id":"p2d","type":"text","x":52,"y":800,"w":696,"rotation":0,
     "content":"Hưởng ứng phong trào toàn dân chung tay bảo vệ môi trường, vì Thủ đô xanh – sạch – đẹp. 15 Ban Công tác Mặt trận đồng loạt ra quân tại các tổ dân phố.",
     "fontSize":28,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#1f2937",
     "bold":false,"italic":false,"align":"left","lineHeight":1.55}
  ]'),

  -- --------------------------------------------------------------- trang 3 --
  (2, '#ffffff', '[
    {"id":"p3a","type":"image","x":52,"y":128,"w":696,"h":450,"rotation":0,
     "src":"/demo/hoat-dong-3.webp","radius":12,"opacity":1,"fit":"cover",
     "borderWidth":0,"borderColor":"#ffffff"},
    {"id":"p3b","type":"text","x":52,"y":610,"w":696,"rotation":0,
     "content":"CHĂM LO AN SINH XÃ HỘI",
     "fontSize":46,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#c81e1e",
     "bold":true,"italic":false,"align":"left","lineHeight":1.2},
    {"id":"p3c","type":"text","x":52,"y":695,"w":696,"rotation":0,
     "content":"Thăm hỏi, tặng quà các gia đình có hoàn cảnh khó khăn trên địa bàn 15 tổ dân phố; vận động nguồn lực chăm lo người nghèo và đối tượng chính sách.",
     "fontSize":28,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#1f2937",
     "bold":false,"italic":false,"align":"left","lineHeight":1.55}
  ]'),

  -- ------------------------------------------------------------ trang cuối --
  (3, '#c81e1e', '[
    {"id":"p4a","type":"text","x":60,"y":360,"w":680,"rotation":0,
     "content":"UỶ BAN MTTQ VIỆT NAM\nPHƯỜNG YÊN NGHĨA",
     "fontSize":48,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#ffffff",
     "bold":true,"italic":false,"align":"center","lineHeight":1.3},
    {"id":"p4b","type":"text","x":60,"y":545,"w":680,"rotation":0,
     "content":"15 Ban Công tác Mặt trận\ntại 15 Tổ dân phố trực thuộc",
     "fontSize":34,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#ffd24a",
     "bold":true,"italic":false,"align":"center","lineHeight":1.4},
    {"id":"p4c","type":"text","x":60,"y":700,"w":680,"rotation":0,
     "content":"Nhiệm kỳ 2025 – 2028",
     "fontSize":28,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#ffffff",
     "bold":false,"italic":false,"align":"center","lineHeight":1.4}
  ]')

) as p(ord, bg, els);
