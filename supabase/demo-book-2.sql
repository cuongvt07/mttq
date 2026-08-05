-- ============================================================================
-- Sách demo 2: Bản tin Mặt trận số 02 — bố cục kiểu bài viết + lưới ảnh
-- (mô phỏng mẫu bản tin có băng đỏ tiêu đề, đoạn nội dung dài, ảnh xếp lưới)
-- Chạy lại nhiều lần vẫn an toàn.
-- ============================================================================

delete from public.books where slug = 'ban-tin-mat-tran-08-2026';

with b as (
  insert into public.books (id, title, slug, page_ratio, chrome)
  values (
    '801b7609-98fa-441c-94a8-da1d061c6054',
    'Bản tin Mặt trận tháng 8/2026 — số 02',
    'ban-tin-mat-tran-08-2026',
    '3:4',
    '{
      "margin": 50,
      "skipFirstPage": true,
      "header": {
        "enabled": true,
        "text": "UỶ BAN MTTQ VIỆT NAM PHƯỜNG YÊN NGHĨA",
        "align": "left",
        "fontSize": 19,
        "color": "#b8860b",
        "rule": true,
        "ruleColor": "#c81e1e",
        "ruleWidth": 2
      },
      "footer": {
        "enabled": true,
        "text": "Bản tin số 02 · tháng 8/2026",
        "align": "left",
        "fontSize": 18,
        "color": "#8a6d1f",
        "rule": true,
        "ruleColor": "#e0c060",
        "ruleWidth": 2,
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
  (0, '#faf3e0', '[
    {"id":"b1","type":"text","x":50,"y":90,"w":700,"rotation":0,
     "content":"BẢN TIN MẶT TRẬN",
     "fontSize":56,"fontFamily":"\"Times New Roman\", Times, serif","color":"#c81e1e",
     "bold":true,"italic":false,"align":"center","lineHeight":1.2},
    {"id":"b2","type":"text","x":50,"y":175,"w":700,"rotation":0,
     "content":"PHƯỜNG YÊN NGHĨA · SỐ 02 · THÁNG 8/2026",
     "fontSize":26,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#0b3f8f",
     "bold":true,"italic":false,"align":"center","lineHeight":1.4},
    {"id":"b3","type":"image","x":70,"y":250,"w":660,"h":420,"rotation":0,
     "src":"/demo/hoat-dong-4.webp","radius":10,"opacity":1,"fit":"cover",
     "borderWidth":8,"borderColor":"#c81e1e"},
    {"id":"b4","type":"text","x":70,"y":700,"w":660,"rotation":0,
     "content":"LỄ RA MẮT TỔ TỰ QUẢN CƠ SỞ\nTRONG CÔNG TÁC BẢO VỆ MÔI TRƯỜNG",
     "fontSize":34,"fontFamily":"\"Times New Roman\", Times, serif","color":"#0b3f8f",
     "bold":true,"italic":false,"align":"center","lineHeight":1.35},
    {"id":"b5","type":"text","x":70,"y":830,"w":660,"rotation":0,
     "content":"15 Ban Công tác Mặt trận · 15 Tổ dân phố",
     "fontSize":24,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#8a6d1f",
     "bold":false,"italic":true,"align":"center","lineHeight":1.4}
  ]'),

  -- ------------------------------------------ trang 2: bài viết + 2 ảnh --
  (1, '#fffdf7', '[
    {"id":"a1","type":"text","x":50,"y":110,"w":700,"rotation":0,
     "content":"KỶ NIỆM 85 NĂM NGÀY THÀNH LẬP\nĐỘI THIẾU NIÊN TIỀN PHONG HỒ CHÍ MINH",
     "fontSize":32,"fontFamily":"\"Times New Roman\", Times, serif","color":"#c81e1e",
     "bold":true,"italic":false,"align":"center","lineHeight":1.3},
    {"id":"a2","type":"text","x":50,"y":300,"w":700,"rotation":0,
     "content":"Ngày 28/4/2026, Uỷ ban MTTQ Việt Nam phường phối hợp Đoàn Thanh niên, Hội đồng Đội tổ chức Lễ ra mắt Tổ tự quản cơ sở, đồng thời kỷ niệm 85 năm Ngày thành lập Đội Thiếu niên Tiền phong Hồ Chí Minh.",
     "fontSize":27,"fontFamily":"\"Times New Roman\", Times, serif","color":"#1f2937",
     "bold":false,"italic":false,"align":"left","lineHeight":1.6},
    {"id":"a3","type":"text","x":50,"y":500,"w":700,"rotation":0,
     "content":"Tổ tự quản có nhiệm vụ duy trì, khắc phục 5 điểm nghẽn về môi trường trên địa bàn; vận động nhân dân giữ gìn vệ sinh, phân loại rác tại nguồn và xây dựng nếp sống đô thị văn minh.",
     "fontSize":27,"fontFamily":"\"Times New Roman\", Times, serif","color":"#1f2937",
     "bold":false,"italic":false,"align":"left","lineHeight":1.6},
    {"id":"a4","type":"image","x":50,"y":700,"w":340,"h":200,"rotation":0,
     "src":"/demo/hoat-dong-1.webp","radius":8,"opacity":1,"fit":"cover",
     "borderWidth":3,"borderColor":"#e0c060"},
    {"id":"a5","type":"image","x":410,"y":700,"w":340,"h":200,"rotation":0,
     "src":"/demo/hoat-dong-5.webp","radius":8,"opacity":1,"fit":"cover",
     "borderWidth":3,"borderColor":"#e0c060"},
    {"id":"a6","type":"text","x":50,"y":920,"w":700,"rotation":0,
     "content":"Lễ ra mắt Tổ tự quản cơ sở tại địa bàn dân cư số 19",
     "fontSize":22,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#6b7280",
     "bold":false,"italic":true,"align":"center","lineHeight":1.4}
  ]'),

  -- ------------------------------------------------ trang 3: lưới 4 ảnh --
  (2, '#fffdf7', '[
    {"id":"g0","type":"text","x":50,"y":120,"w":700,"rotation":0,
     "content":"HÌNH ẢNH HOẠT ĐỘNG",
     "fontSize":40,"fontFamily":"\"Times New Roman\", Times, serif","color":"#c81e1e",
     "bold":true,"italic":false,"align":"center","lineHeight":1.25},
    {"id":"g1","type":"image","x":50,"y":200,"w":340,"h":250,"rotation":0,
     "src":"/demo/hoat-dong-2.webp","radius":8,"opacity":1,"fit":"cover",
     "borderWidth":3,"borderColor":"#e0c060"},
    {"id":"g2","type":"image","x":410,"y":200,"w":340,"h":250,"rotation":0,
     "src":"/demo/hoat-dong-3.webp","radius":8,"opacity":1,"fit":"cover",
     "borderWidth":3,"borderColor":"#e0c060"},
    {"id":"g3","type":"image","x":50,"y":470,"w":340,"h":250,"rotation":0,
     "src":"/demo/hoat-dong-4.webp","radius":8,"opacity":1,"fit":"cover",
     "borderWidth":3,"borderColor":"#e0c060"},
    {"id":"g4","type":"image","x":410,"y":470,"w":340,"h":250,"rotation":0,
     "src":"/demo/hoat-dong-5.webp","radius":8,"opacity":1,"fit":"cover",
     "borderWidth":3,"borderColor":"#e0c060"},
    {"id":"g5","type":"text","x":50,"y":750,"w":700,"rotation":0,
     "content":"Cán bộ, hội viên và nhân dân 15 tổ dân phố tham gia các hoạt động do Uỷ ban MTTQ Việt Nam phường Yên Nghĩa phát động trong tháng 8/2026.",
     "fontSize":26,"fontFamily":"\"Times New Roman\", Times, serif","color":"#1f2937",
     "bold":false,"italic":false,"align":"center","lineHeight":1.6}
  ]'),

  -- -------------------------------------------- trang 4: ảnh lớn + chú --
  (3, '#fffdf7', '[
    {"id":"h1","type":"text","x":50,"y":120,"w":700,"rotation":0,
     "content":"XÂY DỰNG KHU DÂN CƯ VĂN MINH",
     "fontSize":38,"fontFamily":"\"Times New Roman\", Times, serif","color":"#0b3f8f",
     "bold":true,"italic":false,"align":"left","lineHeight":1.25},
    {"id":"h2","type":"image","x":50,"y":230,"w":700,"h":400,"rotation":0,
     "src":"/demo/hoat-dong-3.webp","radius":10,"opacity":1,"fit":"cover",
     "borderWidth":0,"borderColor":"#ffffff"},
    {"id":"h3","type":"text","x":50,"y":670,"w":700,"rotation":0,
     "content":"Mặt trận phường tiếp tục nhân rộng mô hình tổ tự quản, gắn với cuộc vận động “Toàn dân đoàn kết xây dựng nông thôn mới, đô thị văn minh”; biểu dương kịp thời tập thể, cá nhân tiêu biểu tại cộng đồng dân cư.",
     "fontSize":27,"fontFamily":"\"Times New Roman\", Times, serif","color":"#1f2937",
     "bold":false,"italic":false,"align":"left","lineHeight":1.6}
  ]'),

  -- ------------------------------------------------------------ bìa sau --
  (4, '#0b3f8f', '[
    {"id":"z1","type":"text","x":60,"y":380,"w":680,"rotation":0,
     "content":"UỶ BAN MTTQ VIỆT NAM\nPHƯỜNG YÊN NGHĨA",
     "fontSize":46,"fontFamily":"\"Times New Roman\", Times, serif","color":"#ffffff",
     "bold":true,"italic":false,"align":"center","lineHeight":1.3},
    {"id":"z2","type":"text","x":60,"y":560,"w":680,"rotation":0,
     "content":"Bản tin nội bộ · phát hành hằng tháng",
     "fontSize":28,"fontFamily":"\"Segoe UI\", system-ui, sans-serif","color":"#ffd24a",
     "bold":false,"italic":false,"align":"center","lineHeight":1.4}
  ]')

) as p(ord, bg, els);
