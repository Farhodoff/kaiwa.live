#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract_minna_shokyu1_full.py
Full extractor for Minna no Nihongo Shokyu 1 (Lessons 1-25) Uzbek Edition.
"""

import os
import sys
import re
import json
import fitz

PDF_PATH = "/Users/farhod/Desktop/みんなの日本語初級1_翻訳•文法解説ウズベク語版.pdf"
OUTPUT_JSON = "/Users/farhod/Documents/github/kaiwa.live/src/data/minna_shokyu1_complete.json"

LESSON_TITLES = {
    1: {"uz": "1-dars: Tanishuv va O'zini tanishtirish", "ja": "第1課：自己紹介と挨拶"},
    2: {"uz": "2-dars: Buyumlar va Ko'rsatish olmoshlari", "ja": "第2課：物の名前と指示代名詞"},
    3: {"uz": "3-dars: Joylar va Narx-navo", "ja": "第3課：場所と買い物・値段"},
    4: {"uz": "4-dars: Vaqt, Soatlar va Fe'llar (Ertalabdan kechgacha)", "ja": "第4課：時間・動詞の現在と過去"},
    5: {"uz": "5-dars: Harakat, Transport va Safar", "ja": "第5課：行く・来る・帰る・交通手段"},
    6: {"uz": "6-dars: Kundalik faoliyat va Obyekt (Harakat fe'llari)", "ja": "第6課：動詞と目的語（〜を、〜で）"},
    7: {"uz": "7-dars: Qurol, Til va Sovg'a almashish (Bermoq/Olmoq)", "ja": "第7課：手段と授受（あげます・もらいます）"},
    8: {"uz": "8-dars: Sifatlar (I-sifat va Na-sifatlar)", "ja": "第8課：形容詞（い形容詞・な形容詞）"},
    9: {"uz": "9-dars: Qobiliyat, Xohish va Sabab (Yoqtirish/Tushunish)", "ja": "第9課：好き・上手・わかります・から"},
    10: {"uz": "10-dars: Mavjudlik va Joylashuv (Insonlar va Buyumlar)", "ja": "第10課：存在（あります・います・場所）"},
    11: {"uz": "11-dars: Sanoq so'zlar, Muddat va Miqdor", "ja": "第11課：助数詞・期間・数量"},
    12: {"uz": "12-dars: O'tgan zamon va Taqqoslash (Eng va Ko'ra)", "ja": "第12課：過去形と比較（〜より・一番）"},
    13: {"uz": "13-dars: Istak-xohish va Maqsad (Xohlamoq/Bormoq)", "ja": "第13課：希望と目的（欲しい・〜たい・に行きます）"},
    14: {"uz": "14-dars: Fe'lning Te-shakli va Iltimos (Buyruq va Iltimos)", "ja": "第14課：て形と依頼（〜てください・〜ています）"},
    15: {"uz": "15-dars: Ruxsat, Taqiq va Holat fe'llari", "ja": "第15課：許可と禁止（〜てもいいです・てはいけません）"},
    16: {"uz": "16-dars: Harakatlar ketma-ketligi va Sifatlarni bog'lash", "ja": "第16課：動作の連続（〜てから・〜くて）"},
    17: {"uz": "17-dars: Fe'lning Nai-shakli va Majburiyat", "ja": "第17課：ない形と義務（〜ないでください・なければなりません）"},
    18: {"uz": "18-dars: Lug'at shakli (Jishokei) va Qobiliyat/Qiziqish", "ja": "第18課：辞書形と可能・趣味（ことができます・まえに）"},
    19: {"uz": "19-dars: Fe'lning Ta-shakli, Tajriba va O'zgarish", "ja": "第19課：た形・経験と変化（たことがあります・たり・くなります）"},
    20: {"uz": "20-dars: Oddiy uslub (Futsuugo) va Do'stona muloqot", "ja": "第20課：普通形と会話体（丁寧体から普通体へ）"},
    21: {"uz": "21-dars: Shaxsiy fikr va Iqtibos keltirish", "ja": "第21課：意見と引用（〜と思います・〜と言いました）"},
    22: {"uz": "22-dars: Aniqlovchi gaplar (Kanshi / Modifying Clauses)", "ja": "第22課：名詞修飾（連体修飾節）"},
    23: {"uz": "23-dars: Shart va Vaqt (Qachonki / Qilsa)", "ja": "第23課：時と条件（〜とき・〜と、〜）"},
    24: {"uz": "24-dars: Muruvvat va Yordam (Bermoq, Olib bermoq)", "ja": "第24課：授受動詞（くれます・〜てあげます・てもらいます）"},
    25: {"uz": "25-dars: Shartli mayl va Davomiylik (Tara va Temo)", "ja": "第25課：条件表現（〜たら・〜ても）"}
}

def clean_uz(text):
    text = text.replace('`', "'").replace('’', "'").replace('‘', "'")
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def is_jp(s):
    return any(ord(c) > 0x3000 for c in s)

def extract_page_with_ruby(page):
    d = page.get_text("dict")
    ruby_spans = []
    base_spans = []
    
    for b in d.get("blocks", []):
        if "lines" in b:
            for line in b["lines"]:
                for s in line["spans"]:
                    t = s["text"].strip()
                    if not t:
                        continue
                    if s["size"] < 7.5 and is_jp(t):
                        ruby_spans.append(s)
                    else:
                        base_spans.append(s)

    for b in base_spans:
        bx0, by0, bx1, by1 = b["bbox"]
        rubies = []
        for r in ruby_spans:
            rx0, ry0, rx1, ry1 = r["bbox"]
            r_center = (rx0 + rx1) / 2.0
            if (bx0 - 2.0) <= r_center <= (bx1 + 2.0):
                if -2.0 <= (by0 - ry1) <= 8.0 or -2.0 <= (by0 - ry0) <= 14.0:
                    rubies.append((rx0, r["text"].strip()))
        if rubies:
            rubies.sort()
            combined_ruby = "".join(r[1] for r in rubies)
            b["annotated_text"] = f"{b['text']}[{combined_ruby}]"
        else:
            b["annotated_text"] = b["text"]

    return base_spans

def parse_vocab(pages, les_num):
    vocab = []
    for page in pages:
        spans = extract_page_with_ruby(page)
        spans.sort(key=lambda s: s['bbox'][1])
        
        # Cluster spans into lines
        lines = []
        for s in spans:
            if s['bbox'][1] < 115 and ('DARS' in s['text'] or f'{les_num}-' in s['text']):
                continue
            if 'Yangi so' in s['text'] or s['text'] in ['Ⅰ', 'Ⅰ.', 'Ⅰ．']:
                continue
            if '＊＊＊＊＊' in s['text']:
                continue
            if 'Ⅱ. Tarjima' in s['text'] or 'Ⅱ．Tarjima' in s['text']:
                break
                
            if not lines:
                lines.append([s])
            else:
                last_y = sum(x['bbox'][1] for x in lines[-1]) / len(lines[-1])
                if abs(s['bbox'][1] - last_y) <= 5.0:
                    lines[-1].append(s)
                else:
                    lines.append([s])

        current_entry = None
        for l in lines:
            l.sort(key=lambda s: s['bbox'][0])
            col1 = [s for s in l if s['bbox'][0] < 205]
            col2 = [s for s in l if 205 <= s['bbox'][0] < 315]
            col3 = [s for s in l if s['bbox'][0] >= 315]
            
            c1_txt = " ".join(s['annotated_text'] for s in col1).strip()
            c2_txt = " ".join(s['annotated_text'] for s in col2).strip()
            c3_txt = " ".join(s['annotated_text'] for s in col3).strip()
            
            # Start new entry if Japanese in col1 or col2
            if is_jp(c1_txt) or (not c1_txt and is_jp(c2_txt) and c3_txt):
                if current_entry and current_entry.get('kana'):
                    vocab.append(current_entry)
                
                kana = c1_txt
                kanji = c2_txt
                meaning = c3_txt
                
                if c2_txt and not is_jp(c2_txt):
                    meaning = f"{c2_txt} {meaning}".strip()
                    kanji = ""
                    
                group = None
                m_grp = re.match(r'^(.*?)(\s*[ⅠⅡⅢ])\s*$', kana)
                if m_grp:
                    kana = m_grp.group(1).strip()
                    group = f"Group {m_grp.group(2).strip()}"
                    
                current_entry = {
                    "kana": kana,
                    "kanji": kanji,
                    "meaning": clean_uz(meaning),
                    "group": group
                }
            elif current_entry and (c3_txt or c2_txt or c1_txt):
                extra = " ".join(filter(None, [c1_txt, c2_txt, c3_txt])).strip()
                if extra:
                    current_entry["meaning"] = clean_uz(f"{current_entry['meaning']} {extra}")

        if current_entry and current_entry.get('kana'):
            vocab.append(current_entry)

    # Post-process vocab: remove duplicates, sanitize
    seen = set()
    cleaned = []
    for idx, v in enumerate(vocab):
        k = v['kana'].replace(' ', '')
        if not k or k in seen or len(k) < 1:
            continue
        seen.add(k)
        v['id'] = f"m1-l{les_num}-v{len(cleaned)+1}"
        cleaned.append(v)
    return cleaned

def parse_grammar(pages, les_num):
    all_lines = []
    for page in pages:
        spans = extract_page_with_ruby(page)
        spans.sort(key=lambda s: s['bbox'][1])
        lines = []
        for s in spans:
            if not lines:
                lines.append([s])
            else:
                last_y = sum(x['bbox'][1] for x in lines[-1]) / len(lines[-1])
                if abs(s['bbox'][1] - last_y) <= 5.0:
                    lines[-1].append(s)
                else:
                    lines.append([s])
        for l in lines:
            l.sort(key=lambda s: s['bbox'][0])
            line_txt = " ".join(s['annotated_text'] for s in l).strip()
            if line_txt:
                all_lines.append(line_txt)

    # Segment by rule numbers e.g. "1.", "2.", "3.", etc.
    grammar_rules = []
    curr_rule = None
    
    for line in all_lines:
        if 'Ⅳ' in line and 'Grammatika' in line:
            continue
        # Check if line starts with e.g. "1. ", "2. ", "3. "
        m_rule = re.match(r'^(\d+)\s*[\.\)］\]]\s*(.*)$', line)
        if m_rule:
            num = int(m_rule.group(1))
            # Don't confuse with sub-numbered points like 1) if inside rule, but "1. " is a top-level rule
            if '.' in line[:4]:
                if curr_rule:
                    grammar_rules.append(curr_rule)
                curr_rule = {
                    "id": f"m1-l{les_num}-g{len(grammar_rules)+1}",
                    "pointNumber": num,
                    "title": line,
                    "formula": m_rule.group(2).strip(),
                    "explanation": "",
                    "examples": []
                }
                continue
                
        # Check if line is an example starting with circle number ① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ ⑩ ⑪ ⑫
        m_ex = re.match(r'^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮]\s*(.*)$', line)
        if m_ex and curr_rule:
            ex_content = m_ex.group(1).strip()
            # Split Japanese and Uzbek if possible (usually multiple spaces or colon)
            parts = re.split(r'\s{3,}|\t+', ex_content)
            if len(parts) >= 2:
                curr_rule["examples"].append({
                    "ja": parts[0].strip(),
                    "uz": clean_uz(parts[1])
                })
            else:
                # Check for colon or last period
                curr_rule["examples"].append({
                    "ja": ex_content,
                    "uz": ""
                })
            continue

        if curr_rule:
            # Check if line is example continuation
            if curr_rule["examples"] and (line.startswith('…') or line.startswith('...') or not curr_rule["examples"][-1]["uz"]):
                if not curr_rule["examples"][-1]["uz"]:
                    curr_rule["examples"][-1]["uz"] = clean_uz(line)
                else:
                    curr_rule["examples"][-1]["uz"] = clean_uz(f"{curr_rule['examples'][-1]['uz']} {line}")
            else:
                curr_rule["explanation"] = clean_uz(f"{curr_rule['explanation']} {line}")

    if curr_rule:
        grammar_rules.append(curr_rule)

    return grammar_rules

def parse_dialogue(page, les_num):
    text = page.get_text('text')
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    in_suhbat = False
    title = ""
    dialogue_lines = []
    
    for line in lines:
        if 'Suhbat' in line or 'SUHBAT' in line:
            in_suhbat = True
            continue
        if in_suhbat:
            if not title:
                title = line
                continue
            if '---' in line or '＊＊＊' in line:
                continue
            if ':' in line or '：' in line:
                parts = re.split(r'[:：]', line, 1)
                speaker = clean_uz(parts[0])
                speech = clean_uz(parts[1])
                dialogue_lines.append({
                    "speaker": speaker,
                    "text": speech
                })
            elif dialogue_lines:
                dialogue_lines[-1]["text"] = clean_uz(f"{dialogue_lines[-1]['text']} {line}")

    return {
        "title": title or f"{les_num}-dars suhbati",
        "lines": dialogue_lines
    }

def main():
    doc = fitz.open(PDF_PATH)
    all_lessons = []
    
    print(f"Opening {PDF_PATH} ({len(doc)} pages)...")
    
    for les in range(1, 26):
        base = 27 + (les - 1) * 6
        vocab_pages = [doc[base], doc[base+1]]
        # If lesson 12 or others have vocab on base+2 before Tarjima
        p2_text = doc[base+2].get_text('text')
        if 'Ⅱ. Tarjima' not in p2_text[:50]:
            vocab_pages.append(doc[base+2])
            
        trans_page = doc[base+2]
        extra_page = doc[base+3]
        grammar_pages = [doc[base+4], doc[base+5]]
        
        vocab = parse_vocab(vocab_pages, les)
        grammar = parse_grammar(grammar_pages, les)
        dialogue = parse_dialogue(trans_page, les)
        
        lesson_data = {
            "lessonNumber": les,
            "title": LESSON_TITLES[les]["uz"],
            "title_ja": LESSON_TITLES[les]["ja"],
            "vocabCount": len(vocab),
            "grammarCount": len(grammar),
            "dialogueCount": len(dialogue["lines"]),
            "vocabulary": vocab,
            "grammar": grammar,
            "dialogue": dialogue
        }
        all_lessons.append(lesson_data)
        print(f"Lesson {les:02d}: {len(vocab):2d} vocab | {len(grammar):2d} grammar rules | {len(dialogue['lines']):2d} dialogue lines")

    total_vocab = sum(l['vocabCount'] for l in all_lessons)
    total_grammar = sum(l['grammarCount'] for l in all_lessons)
    print("=" * 60)
    print(f"Extraction Complete!")
    print(f"Total Lessons: {len(all_lessons)}")
    print(f"Total Vocabulary: {total_vocab}")
    print(f"Total Grammar Rules: {total_grammar}")
    
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_lessons, f, ensure_ascii=False, indent=2)
    print(f"Saved to {OUTPUT_JSON}")

if __name__ == '__main__':
    main()
