import json
import sys
sys.path.append('scripts')
from build_n2_data_part1 import part1
from build_n2_data_part2 import part2

combined = {**part1, **part2}

file_path = 'src/data/vocab/jlptVocabN2.json'
with open(file_path, 'r', encoding='utf-8') as f:
    vocab_list = json.load(f)

updated_count = 0
for entry in vocab_list:
    eid = entry.get('id')
    if eid in combined:
        item = combined[eid]
        if 'word' in item:
            entry['word'] = item['word']
        entry['meaningUz'] = item['meaningUz']
        entry['examples'] = [{
            'ja': item['ja'],
            'romaji': item['romaji'],
            'uz': item['uz']
        }]
        updated_count += 1

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(vocab_list, f, ensure_ascii=False, indent=2)

print(f"Successfully updated {updated_count} entries in {file_path}")
