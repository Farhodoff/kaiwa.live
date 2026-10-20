import json
import re
import pykakasi

kks = pykakasi.kakasi()

def to_clean_romaji(text):
    if not text or not text.strip():
        return ""
    t = text
    # Pronouns & common compounds
    t = re.sub(r'あの\s*人', 'あのひと', t)
    t = re.sub(r'この\s*人', 'このひと', t)
    t = re.sub(r'その\s*人', 'そのひと', t)
    t = re.sub(r'あの\s*方', 'あのかた', t)
    t = re.sub(r'この\s*方', 'このかた', t)
    t = re.sub(r'その\s*方', 'そのかた', t)
    t = re.sub(r'1\s*人', 'ひとり', t)
    t = re.sub(r'2\s*人', 'ふたり', t)
    t = re.sub(r'4\s*人', 'よにん', t)
    t = re.sub(r'(\d+)\s*人', r'\1にん', t)
    t = re.sub(r'(\d+)\s*歳', r'\1さい', t)
    t = re.sub(r'(アメリカ|日本|ブラジル|ドイツ|フランス|イギリス|中国|韓国|ロシア|タイ|ベトナム|ウズベキスタン)人', r'\1じん', t)
    
    # Collocations with aru/iru
    t = re.sub(r'([一-龥ぁ-んァ-ヶ])(が|に|で)(ある|いる|ない)', r'\1 \2 \3', t)
    # Isolate particle を
    t = re.sub(r'([^\s])を([^\s])', r'\1 を \2', t)
    # Particles attached to kanji/katakana/digits
    t = re.sub(r'([一-龥ァ-ヶa-zA-Z0-9])([はへがでにのと])(?=[^\s]|$)', r'\1 \2 ', t)
    t = re.sub(r'([一-龥ァ-ヶa-zA-Z0-9])(から|まで|より)(?=[^\s]|$)', r'\1 \2 ', t)
    
    # Pronoun + particles
    t = re.sub(r'(わたし|わたしたち|ぼく|おれ|あなた|かれ|かのじょ|これ|それ|あれ|どれ|ここ|そこ|あそこ|どこ)は', r'\1 は ', t)
    t = re.sub(r'(わたし|わたしたち|ぼく|おれ|あなた|かれ|かのじょ|これ|それ|あれ|どれ|ここ|そこ|あそこ|どこ)の', r'\1 の ', t)
    t = re.sub(r'(わたし|わたしたち|ぼく|おれ|あなた|かれ|かのじょ|これ|それ|あれ|どれ|ここ|そこ|あそこ|どこ)に', r'\1 に ', t)
    t = re.sub(r'(わたし|わたしたち|ぼく|おれ|あなた|かれ|かのじょ|これ|それ|あれ|どれ|ここ|そこ|あそこ|どこ)が', r'\1 が ', t)
    t = re.sub(r'(ひと|だれ|ともだち|せんせい|がくせい)は', r'\1 は ', t)
    
    result = kks.convert(t)
    words = []
    for item in result:
        h = item['hepburn']
        orig = item['orig']
        if orig == 'は':
            words.append('wa')
        elif orig == 'へ':
            words.append('e')
        elif orig == 'を':
            words.append('o')
        elif orig in ['。', '、', '？', '！', '.', '?', '!']:
            punct = '.' if orig == '。' else (',' if orig == '、' else ('?' if orig == '？' else ('!' if orig == '！' else orig)))
            if words:
                words[-1] = words[-1] + punct
            else:
                words.append(punct)
        elif h.strip():
            words.append(h.strip())
            
    sentence = ' '.join(words)
    # Join polite verb endings
    sentence = re.sub(r'(\w+)\s+(masu|mashita|masen|masendeshita)\b', r'\1\2', sentence)
    sentence = re.sub(r'\s+([,.?!])', r'\1', sentence)
    sentence = re.sub(r'\s+', ' ', sentence).strip()
    if sentence:
        sentence = sentence[0].upper() + sentence[1:]
    return sentence

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    updated = 0
    for entry in data:
        for ex in entry.get('examples', []):
            if not ex.get('romaji') or ex['romaji'].strip() == '':
                ja = ex.get('ja', '')
                if ja:
                    ex['romaji'] = to_clean_romaji(ja)
                    updated += 1
                    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Updated {updated} examples in {file_path}")

process_file('src/data/vocab/jlptVocabN5.json')
process_file('src/data/vocab/jlptVocabN3.json')
