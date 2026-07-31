-- ============================================================================
-- Đầu trang / chân trang cho sách lật: chữ cố định, số trang, đường kẻ.
-- Chạy lại nhiều lần vẫn an toàn.
-- ============================================================================

alter table public.books add column if not exists chrome jsonb not null default '{
  "margin": 48,
  "skipFirstPage": true,
  "header": {
    "enabled": false, "text": "", "align": "center",
    "fontSize": 16, "color": "#7a8797",
    "rule": true, "ruleColor": "#d8dee6", "ruleWidth": 1
  },
  "footer": {
    "enabled": true, "text": "", "align": "left",
    "fontSize": 15, "color": "#7a8797",
    "rule": true, "ruleColor": "#d8dee6", "ruleWidth": 1,
    "pageNumber": true, "pageNumberAlign": "right"
  }
}'::jsonb;

comment on column public.books.chrome is
  'Cấu hình đầu/chân trang dùng chung cho mọi trang của sách (JSON)';
