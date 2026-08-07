# -*- coding: utf-8 -*-
"""Bóc nội dung 9 bài 'Dân vận khéo' từ .docx sang JSON + ảnh WebP,
đúng định dạng lib/bulletin-articles.json mà scripts/make-*.mjs đang dùng.

  py extract_dvk.py
"""
import io, json, os, re, zipfile
from xml.etree import ElementTree as ET
from PIL import Image

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'Tin bài dân vân khéo')
NEW = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
PROJ = r'D:\GGsheet\phuong-xanh'
IMGDIR = os.path.join(PROJ, 'public', 'tin', 'dvk')
os.makedirs(IMGDIR, exist_ok=True)

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'rel': 'http://schemas.openxmlformats.org/package/2006/relationships',
}

# file .docx  ->  (key, mục, tiêu đề chuẩn lấy từ DANH MỤC)
BAI = [
    ('YÊN NGHĨA QUYẾT LIỆT THÁO GỠ.docx', 'quyet-liet', 'Công tác Mặt trận',
     'Yên Nghĩa quyết liệt tháo gỡ “5 điểm nghẽn” từ cơ sở'),
    ('PHƯỜNG YÊN NGHĨA.docx', 'tuyen-truyen-co-so', 'Dân vận khéo',
     'Phường Yên Nghĩa: Lấy tuyên truyền từ cơ sở gỡ “điểm nghẽn”'),
    ('GIẢI PHÓNG MẶT BẰNG QUỐC LỘ 6 ĐOẠN QUA YÊN NGHĨA.docx', 'gpmb-dong-thuan', 'Giải phóng mặt bằng',
     'Giải phóng mặt bằng Quốc lộ 6 đoạn qua Yên Nghĩa: Đẩy mạnh tuyên truyền, tạo đồng thuận trong dân'),
    ('CỬ TRI YÊN NGHĨA KIẾN NGHỊ THÁO GỠ VƯỚNG MẮC.docx', 'cu-tri', 'Tiếp xúc cử tri',
     'Cử tri Yên Nghĩa kiến nghị tháo gỡ vướng mắc về đất đai, hạ tầng dân sinh'),
    ('MTTQ YÊN NGHĨA RA MẮT MÔ HÌNH.docx', 'ba-ro-bon-tot', 'Mô hình mới',
     'MTTQ Yên Nghĩa ra mắt mô hình “3 rõ, 4 tốt” tháo gỡ điểm nghẽn đô thị'),
    ('PHƯỜNG YÊN NGHĨA PHÁT ĐỘNG THI ĐUA CAO ĐIỂM THÁO GỠ 5 ĐIỂM NGHẼN TỪ CƠ SỞ.docx', 'thi-dua', 'Thi đua',
     'Phường Yên Nghĩa phát động thi đua cao điểm tháo gỡ 5 điểm nghẽn từ cơ sở'),
    ('UB MTTQ VIỆT NAM PHƯỜNG YÊN NGHĨA ĐỘNG VIÊN LỰC LƯỢNG TUYÊN TRUYỀN THAM GIA GIẢI PHÓNG MẶT BẰNG QUỐC LỘ 6.docx',
     'dong-vien', 'Giải phóng mặt bằng',
     'Uỷ ban MTTQ Việt Nam phường Yên Nghĩa động viên lực lượng tuyên truyền tham gia giải phóng mặt bằng Quốc lộ 6'),
    ('PHƯỜNG YÊN NGHĨA ĐẨY NHANH TIẾN ĐỘ GIẢI PHÓNG MẶT BẰNG DỰ ÁN CẢI TẠO.docx', 'day-nhanh', 'Giải phóng mặt bằng',
     'Phường Yên Nghĩa đẩy nhanh tiến độ giải phóng mặt bằng dự án cải tạo, mở rộng Quốc lộ 6'),
    ('DÂN VẬN KHÉO Ở YÊN NGHĨA - ĐI TỪNG NGÕ, GÕ TỪNG NHÀ, GỠ TỪNG VƯỚNG MẮC.docx', 'di-tung-ngo', 'Dân vận khéo',
     'Dân vận khéo ở Yên Nghĩa: Đi từng ngõ, gõ từng nhà, gỡ từng vướng mắc'),
]


def rels(z):
    root = ET.fromstring(z.read('word/_rels/document.xml.rels'))
    return {r.get('Id'): r.get('Target') for r in root.findall('rel:Relationship', NS)}


def tokens(z):
    """Duyệt tài liệu theo đúng thứ tự, trả về [('img', rid) | ('text', str)]."""
    body = ET.fromstring(z.read('word/document.xml')).find('w:body', NS)
    rmap = rels(z)
    out = []
    for p in body.iter(f'{{{NS["w"]}}}p'):
        buf = []
        for node in p.iter():
            tag = node.tag.split('}')[1]
            if tag == 't':
                buf.append(node.text or '')
            elif tag == 'tab':
                buf.append('\t')
            elif tag == 'br':
                buf.append('\n')
            elif tag in ('blip', 'imagedata'):
                # blip = ảnh DrawingML (Word mới), imagedata = ảnh VML (Word cũ)
                rid = node.get(f'{{{NS["r"]}}}embed') or node.get(f'{{{NS["r"]}}}id')
                if rid:
                    txt = ''.join(buf).strip()
                    if txt:
                        out.append(('text', txt))
                    buf = []
                    out.append(('img', rmap.get(rid)))
        txt = ''.join(buf).strip()
        if txt:
            out.append(('text', txt))
    return out


# Bài gốc chèn ảnh không kèm chú thích -> dùng chú thích chung của bài
CHU_THICH_MAC_DINH = {
    'dong-vien': 'Uỷ ban MTTQ Việt Nam phường Yên Nghĩa làm việc, động viên các tổ '
                 'tuyên truyền giải phóng mặt bằng tại Tổ dân phố Do Lộ. Ảnh: PV',
    'day-nhanh': 'Công tác tháo dỡ, bàn giao mặt bằng phục vụ Dự án cải tạo, mở rộng '
                 'Quốc lộ 6 qua địa bàn phường Yên Nghĩa. Ảnh: PV',
}


def la_chu_thich(t):
    """Chú thích ảnh: có chữ 'Ảnh' hoặc là câu ngắn mô tả sau ảnh."""
    return bool(re.search(r'Ảnh[:"”\s]', t)) or len(t) < 190


def save_img(z, target, key, idx):
    raw = z.read('word/' + target.lstrip('/'))
    im = Image.open(io.BytesIO(raw))
    if im.mode in ('P', 'RGBA'):
        im = im.convert('RGB')
    if im.width > 1600:
        im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
    name = f'{key}-{idx}.webp'
    im.save(os.path.join(IMGDIR, name), 'WEBP', quality=82)
    return {'path': f'/tin/dvk/{name}', 'w': im.width, 'h': im.height}


articles = []
for fname, key, muc, title in BAI:
    path = os.path.join(NEW if key == 'di-tung-ngo' else SRC, fname)
    z = zipfile.ZipFile(path)
    toks = tokens(z)

    paras, images = [], []
    pending = None          # ảnh vừa gặp, đang chờ chú thích
    vua_ghi = None          # ảnh vừa nhận chú thích, phòng khi chú thích bị ngắt dòng
    seen_title = False
    n = 0

    for kind, val in toks:
        if kind == 'img':
            if pending:
                images.append(pending)
            n += 1
            pending = save_img(z, val, key, n)
            pending['caption'] = ''
            continue

        t = re.sub(r'\s+', ' ', val).replace('\xa0', ' ').strip()
        if not t:
            continue

        # bỏ các dòng tiêu đề in hoa ở đầu bài (đã có tiêu đề chuẩn từ DANH MỤC)
        if not seen_title:
            chu = re.sub(r'[^A-Za-zÀ-ỹ]', '', t)
            if chu and chu == chu.upper():
                continue
            seen_title = True

        if pending:
            if la_chu_thich(t):
                pending['caption'] = re.sub(r'Ảnh"', 'Ảnh:', t)
                images.append(pending)
                vua_ghi, pending = pending, None
                continue
            images.append(pending)
            pending = None

        # File gốc ngắt dòng giữa chú thích -> phần đuôi bị tách thành đoạn riêng.
        # Đuôi ngắn, viết thường hoặc có chữ "Ảnh" thì nối lại vào chú thích trước.
        if vua_ghi and len(t) < 70 and (re.search(r'Ảnh[:"]', t) or t[:1].islower()):
            vua_ghi['caption'] = re.sub(r'Ảnh"', 'Ảnh:', f"{vua_ghi['caption']} {t}".strip())
            vua_ghi = None
            continue

        vua_ghi = None
        paras.append(t)

    if pending:
        images.append(pending)

    for im in images:
        if not im['caption']:
            im['caption'] = CHU_THICH_MAC_DINH.get(key, '')

    sapo = paras.pop(0) if paras else ''
    articles.append({
        'key': key, 'muc': muc, 'ok': True, 'title': title, 'sapo': sapo,
        'author': '', 'date': '', 'paragraphs': paras, 'images': images,
        'source': 'Uỷ ban MTTQ Việt Nam phường Yên Nghĩa',
    })
    thieu = sum(1 for i in images if not i['caption'])
    print(f'{key:20} {len(paras):3} đoạn | {len(images):2} ảnh'
          f'{f" ({thieu} ảnh chưa có chú thích)" if thieu else ""}')

out = os.path.join(PROJ, 'lib', 'danvankheo-articles.json')
with io.open(out, 'w', encoding='utf8') as f:
    json.dump(articles, f, ensure_ascii=False, indent=2)
print(f'\n→ {out}')
print(f'→ {IMGDIR} ({len(os.listdir(IMGDIR))} ảnh)')
