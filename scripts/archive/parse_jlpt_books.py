import os
import re
import json
from pypdf import PdfReader

DECKS_DIR = '/Users/farhod/Desktop/github/kaiwa.live/src/data/decks'
os.makedirs(DECKS_DIR, exist_ok=True)

BOOKS_DIR = '/Users/farhod/Desktop/github/kaiwa.live/books'

# Helper regex to recognize Japanese characters (Kanji, Hiragana, Katakana)
JP_RE = re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]')

jlpt_decks = {
    'N5': [],
    'N4': [],
    'N3': [],
    'N2': [],
    'N1': []
}

def extract_level_from_filename(filename):
    fname = filename.upper()
    if 'N5' in fname or 'MINNA' in fname:
        return 'N5'
    elif 'N4' in fname:
        return 'N4'
    elif 'N3' in fname:
        return 'N3'
    elif 'N2' in fname:
        return 'N2'
    elif 'N1' in fname:
        return 'N1'
    return 'N5'

def parse_pdf(filepath, default_level):
    print(f"Parsing {os.path.basename(filepath)} [Level: {default_level}]...")
    try:
        reader = PdfReader(filepath)
        cards = []
        card_id_counter = 1
        
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if not text:
                continue
            
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if not line or len(line) < 3:
                    continue
                
                # Check if line contains Japanese characters
                if JP_RE.search(line):
                    # Match pattern: Japanese Word / Furigana | Meaning
                    parts = re.split(r'[\t\s]{2,}|[=\-\|:：]', line)
                    if len(parts) >= 2:
                        front = parts[0].strip()
                        back = ' '.join(parts[1:]).strip()
                    else:
                        front = line
                        back = f"JLPT {default_level} Vocabulary Item"
                    
                    if JP_RE.search(front) and len(front) <= 60:
                        cards.append({
                            "id": f"jlpt-{default_level.lower()}-{card_id_counter}",
                            "front": front,
                            "back": back,
                            "phonetics": "",
                            "example": f"JLPT {default_level} darsligidan olingan lug'at iborasi.",
                            "level": default_level
                        })
                        card_id_counter += 1
                        
        print(f"-> Extracted {len(cards)} vocabulary items from {os.path.basename(filepath)}")
        return cards
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return []

def main():
    pdf_files = []
    for root, dirs, files in os.walk(BOOKS_DIR):
        for f in files:
            if f.lower().endswith('.pdf'):
                pdf_files.append(os.path.join(root, f))
                
    print(f"Found {len(pdf_files)} PDF files in books directory.")
    
    seen_fronts = {lvl: set() for lvl in jlpt_decks}
    
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        level = extract_level_from_filename(filename)
        extracted_cards = parse_pdf(pdf_path, level)
        
        for card in extracted_cards:
            front = card['front']
            if front not in seen_fronts[level]:
                seen_fronts[level].add(front)
                card['id'] = f"jlpt-{level.lower()}-{len(jlpt_decks[level]) + 1}"
                jlpt_decks[level].append(card)
                
    for lvl, cards in jlpt_decks.items():
        out_path = os.path.join(DECKS_DIR, f"jlpt_{lvl.lower()}.json")
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(cards, f, ensure_ascii=False, indent=2)
        print(f"✅ Saved JLPT {lvl} Deck to {out_path} with {len(cards)} total cards.")

if __name__ == '__main__':
    main()
