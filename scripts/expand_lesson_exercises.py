import json
import os
import re
import random

# Deterministic seed for reproducible test generation
random.seed(42)

LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1']
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def clean_furigana(text):
    if not text:
        return ""
    # Replace 田中[たなか] -> 田中
    return re.sub(r'\[.*?\]', '', text)

def extract_furigana_reading(text):
    # Extract readings if bracketed
    matches = re.findall(r'\[(.*?)\]', text)
    return " / ".join(matches) if matches else ""

def generate_exercises_for_lesson(lesson, level_str, all_level_vocab):
    existing_exercises = lesson['steps'][1]['practiceData'].get('exercises', [])
    existing_ids = {ex['id'] for ex in existing_exercises}
    lesson_num = lesson.get('lessonNumber', 1)
    lesson_id = lesson.get('id', f'ja-{level_str}-l{lesson_num}')

    learn_step = lesson['steps'][0]
    learn_data = learn_step.get('learnData', {})
    vocab_list = learn_data.get('vocabulary', [])
    grammar_list = learn_data.get('grammarRules', [])

    new_exercises = []
    ex_counter = len(existing_exercises) + 1

    # 1. Fill-in-the-blank from vocabulary example sentences
    for v_idx, v in enumerate(vocab_list):
        if len(new_exercises) >= 4:
            break
        term_clean = clean_furigana(v.get('term', ''))
        example_clean = clean_furigana(v.get('exampleSentence', ''))
        example_tr = v.get('exampleTranslation', '')
        meaning = v.get('meaning', '')
        reading = v.get('reading', '')

        if term_clean and example_clean and term_clean in example_clean and len(example_clean) > len(term_clean) + 2:
            blanked = example_clean.replace(term_clean, '（　　）', 1)
            
            # Distractors from other lesson vocab or level vocab
            other_terms = [clean_furigana(x['term']) for x in vocab_list if clean_furigana(x['term']) != term_clean]
            while len(other_terms) < 3:
                sample_v = random.choice(all_level_vocab)
                s_clean = clean_furigana(sample_v.get('term', ''))
                if s_clean and s_clean != term_clean and s_clean not in other_terms:
                    other_terms.append(s_clean)

            random.shuffle(other_terms)
            distractors = other_terms[:3]
            options = [term_clean] + distractors
            random.shuffle(options)
            corr_idx = options.index(term_clean)

            ex_id = f"{lesson_id}-ex-{ex_counter}"
            if ex_id in existing_ids:
                ex_id = f"{lesson_id}-gen-ex-{ex_counter}"

            new_exercises.append({
                "id": ex_id,
                "type": "multiple-choice",
                "prompt": f"Quyidagi jumlada qoldirilgan to'g'ri so'zni tanlang:\n「{blanked}」",
                "options": options,
                "correctAnswer": corr_idx,
                "explanation": f"To'g'ri javob: 「{term_clean}」 ({reading}) — \"{meaning}\". Gapning to'liq ma'nosi: \"{example_tr}\"."
            })
            ex_counter += 1

    # 2. Vocabulary Meaning in Context
    for v in vocab_list:
        if len(new_exercises) >= 5:
            break
        term_clean = clean_furigana(v.get('term', ''))
        meaning = v.get('meaning', '')
        reading = v.get('reading', '')

        if term_clean and meaning:
            other_meanings = [x['meaning'] for x in vocab_list if x.get('meaning') and x['meaning'] != meaning]
            while len(other_meanings) < 3:
                sample_v = random.choice(all_level_vocab)
                m = sample_v.get('meaning', '')
                if m and m != meaning and m not in other_meanings:
                    other_meanings.append(m)

            random.shuffle(other_meanings)
            distractors = other_meanings[:3]
            options = [meaning] + distractors
            random.shuffle(options)
            corr_idx = options.index(meaning)

            ex_id = f"{lesson_id}-ex-{ex_counter}"
            if ex_id in existing_ids:
                ex_id = f"{lesson_id}-gen-ex-{ex_counter}"

            new_exercises.append({
                "id": ex_id,
                "type": "multiple-choice",
                "prompt": f"「{term_clean}」 ({reading}) so'zining to'g'ri o'zbekcha tarjimasini tanlang:",
                "options": options,
                "correctAnswer": corr_idx,
                "explanation": f"「{term_clean}」 ({reading}) so'zi o'zbek tilida \"{meaning}\" ma'nosini bildiradi."
            })
            ex_counter += 1

    # 3. Grammar Rule application & particle/form check
    for g in grammar_list:
        if len(new_exercises) >= 6:
            break
        pattern = g.get('pattern', '')
        g_meaning = g.get('meaning', '')
        examples = g.get('examples', [])

        for ex_item in examples:
            s_clean = clean_furigana(ex_item.get('sentence', ''))
            s_tr = ex_item.get('translation', '')

            # Check if particles can be blanked
            particles = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'から', 'まで', 'より', 'ほど']
            found_p = None
            for p in particles:
                if f" {p} " in s_clean or f"{p}" in s_clean[2:-2]:
                    found_p = p
                    break

            if found_p and len(s_clean) > 6:
                # Replace the particle with blank
                # Blank out one instance
                idx = s_clean.find(found_p, 2)
                if idx != -1:
                    blanked = s_clean[:idx] + '（　　）' + s_clean[idx + len(found_p):]
                    other_p = [p for p in ['は', 'が', 'を', 'に', 'で', 'と', 'から'] if p != found_p]
                    random.shuffle(other_p)
                    options = [found_p] + other_p[:3]
                    random.shuffle(options)
                    corr_idx = options.index(found_p)

                    ex_id = f"{lesson_id}-ex-{ex_counter}"
                    if ex_id in existing_ids:
                        ex_id = f"{lesson_id}-gen-ex-{ex_counter}"

                    new_exercises.append({
                        "id": ex_id,
                        "type": "multiple-choice",
                        "prompt": f"Jumlaga mos to'g'ri zarrachani (particle) tanlang:\n「{blanked}」",
                        "options": options,
                        "correctAnswer": corr_idx,
                        "explanation": f"Ushbu o'rinda 「{found_p}」 zarrachasi to'g'ri keladi. Butun jumla: 「{s_clean}」 ({s_tr})."
                    })
                    ex_counter += 1
                    break

    # 4. Sentence Unscramble / Syntactic ordering (★ JLPT style)
    if grammar_list and len(new_exercises) < 6:
        first_g = grammar_list[0]
        examples = first_g.get('examples', [])
        if examples:
            s_clean = clean_furigana(examples[0].get('sentence', ''))
            s_tr = examples[0].get('translation', '')
            # Split by punctuation or spaces or chunks
            tokens = [w for w in re.split(r'([、。！？\s])', s_clean) if w.strip() and w not in '、。！？']
            if len(tokens) >= 4:
                selected_4 = tokens[:4]
                star_idx = 2 # 3rd position is ★
                star_token = selected_4[star_idx]
                options = list(selected_4)
                random.shuffle(options)
                corr_idx = options.index(star_token)

                ex_id = f"{lesson_id}-ex-{ex_counter}"
                if ex_id in existing_ids:
                    ex_id = f"{lesson_id}-gen-ex-{ex_counter}"

                new_exercises.append({
                    "id": ex_id,
                    "type": "multiple-choice",
                    "prompt": f"Berilgan bo'laklardan to'g'ri gap tuzing va [★] (uchinchi o'rindagi) so'zni aniqlang:\nGap ma'nosi: \"{s_tr}\"",
                    "options": options,
                    "correctAnswer": corr_idx,
                    "explanation": f"To'g'ri gap tartibi: 「{s_clean}」. Yulduzcha [★] o'rnidagi bo'lak: 「{star_token}」."
                })
                ex_counter += 1

    return existing_exercises + new_exercises

def run_expansion():
    total_added = 0
    for lvl in LEVELS:
        json_path = os.path.join(BASE_DIR, 'src', 'data', 'curriculum', 'levels', lvl, 'japaneseLessons.json')
        if not os.path.exists(json_path):
            continue

        with open(json_path, 'r', encoding='utf-8') as f:
            lessons = json.load(f)

        # Collect all vocab for level to use as distractors
        all_vocab = []
        for l in lessons:
            v_list = l.get('steps', [{}])[0].get('learnData', {}).get('vocabulary', [])
            all_vocab.extend(v_list)

        lvl_added = 0
        for l in lessons:
            orig_len = len(l['steps'][1]['practiceData'].get('exercises', []))
            l['steps'][1]['practiceData']['exercises'] = generate_exercises_for_lesson(l, lvl, all_vocab)
            new_len = len(l['steps'][1]['practiceData']['exercises'])
            lvl_added += (new_len - orig_len)

        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(lessons, f, ensure_ascii=False, indent=2)

        print(f"Level {lvl.upper()}: added {lvl_added} exercises across {len(lessons)} lessons.")
        total_added += lvl_added

    print(f"Total practice exercises added across all levels: {total_added}")

if __name__ == '__main__':
    run_expansion()
