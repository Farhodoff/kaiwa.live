import json
import re
import os

PLACEHOLDER_REGEX = re.compile(r'^(文脈に合わない表現|文脈と無関係な文|本文にない情報である|文法的に不自然な表現|意味が異なる表現|意味の異なる文|文法の誤った文|反対の内容である|文法形式だけを述べた選択肢)$')

SPECIAL_LESSON_SENTENCES = {
    'ja-n3-u2-l5': [
        ('新[あたら]しい システムを 導入[どうにゅう]する。', 'Yangi tizimni joriy qilmoq.'),
        ('多[おお]くの 課題[かだい]が ある。', "Ko'plab muammolar bor."),
        ('在宅[ざいたく]勤務[きんむ]で 通勤[つうきん]の ストレスが 減[へ]る。', "Masofaviy ish sababli qatnov stressi kamayadi."),
        ('社員[しゃいん]同士[どうし]の コミュニケーションが 減[へ]る。', "Xodimlar o'rtasida muloqot kamayadi."),
    ]
}

def clean_text(text):
    return str(text or '').strip()

def process_level(level_name):
    file_path = f'src/data/curriculum/levels/{level_name}/japaneseLessons.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        lessons = json.load(f)

    fixed_count = 0

    for lesson in lessons:
        lesson_id = lesson['id']
        learn_data = lesson['steps'][0].get('learnData', {})
        
        # Build sentences and translations pool
        pool = []
        if lesson_id in SPECIAL_LESSON_SENTENCES:
            pool = list(SPECIAL_LESSON_SENTENCES[lesson_id])
        else:
            vocab = learn_data.get('vocabulary', [])
            for v in vocab:
                s = clean_text(v.get('exampleSentence'))
                t = clean_text(v.get('exampleTranslation') or v.get('meaning'))
                if s and t:
                    if not any(item[0] == s for item in pool):
                        pool.append((s, t))
            
            # Also check keyPoints if available
            key_points = learn_data.get('keyPoints', [])
            for kp in key_points:
                kp_clean = clean_text(kp)
                # keyPoints sometimes have "Japanese sentence. (Uzbek translation.)"
                match = re.match(r'^(.*?)\s*\((.*?)\)$', kp_clean)
                if match:
                    s_kp = match.group(1).strip()
                    t_kp = match.group(2).strip()
                    if s_kp and t_kp and not any(item[0] == s_kp for item in pool):
                        pool.append((s_kp, t_kp))

        # Iterate over practice steps
        for step in lesson['steps']:
            exercises = step.get('practiceData', {}).get('exercises', [])
            for ex in exercises:
                opts = ex.get('options', [])
                if not any(PLACEHOLDER_REGEX.match(clean_text(o)) for o in opts):
                    continue

                cat = ex.get('category')
                is_reading = (cat == 'reading-application')

                new_options = []
                # Always preserve option 0
                op0 = opts[0]
                new_options.append(op0)

                # Keep any existing non-placeholder options
                for o in opts[1:]:
                    co = clean_text(o)
                    if not PLACEHOLDER_REGEX.match(co) and co not in new_options:
                        new_options.append(o)

                # Now fill remaining slots up to 4
                if is_reading:
                    # Fill with Uzbek translations
                    candidates = [item[1] for item in pool if item[1] not in new_options]
                    idx = 0
                    while len(new_options) < 4 and idx < len(candidates):
                        new_options.append(candidates[idx])
                        idx += 1
                else:
                    # Fill with Japanese sentences
                    candidates = [item[0] for item in pool if item[0] not in new_options]
                    idx = 0
                    while len(new_options) < 4 and idx < len(candidates):
                        new_options.append(candidates[idx])
                        idx += 1

                if len(new_options) < 4:
                    raise ValueError(f"Could not find enough distinct options for {lesson_id} {ex.get('id')}: {new_options}")

                ex['options'] = new_options[:4]
                fixed_count += 1

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print(f"Level {level_name.upper()}: successfully replaced placeholders in {fixed_count} exercises.")

if __name__ == '__main__':
    for lvl in ['n3', 'n2', 'n1']:
        process_level(lvl)
