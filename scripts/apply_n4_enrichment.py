#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Applies N4 practice database expansion across:
1. src/data/curriculum/levels/n4/japaneseLessons.json (25 lessons * 15 exercises = 375 total exercises)
2. src/data/decks/n4_500_mon.json (84 rapid drill cards)
"""

import json
import os
import sys

# Ensure local imports work
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

from n4_data.unit1 import UNIT1_EXERCISES
from n4_data.unit2 import UNIT2_EXERCISES
from n4_data.unit3 import UNIT3_EXERCISES
from n4_data.unit4 import UNIT4_EXERCISES
from n4_data.unit5 import UNIT5_EXERCISES
from n4_data.n4_500_mon_data import N4_500_MON_CARDS

def main():
    root_dir = os.path.abspath(os.path.join(script_dir, '..'))
    n4_lessons_path = os.path.join(root_dir, 'src', 'data', 'curriculum', 'levels', 'n4', 'japaneseLessons.json')
    n4_500_mon_path = os.path.join(root_dir, 'src', 'data', 'decks', 'n4_500_mon.json')

    print(f"Loading N4 lessons from: {n4_lessons_path}")
    with open(n4_lessons_path, 'r', encoding='utf-8') as f:
        lessons = json.load(f)

    # Combine all unit exercises
    all_unit_exercises = {}
    all_unit_exercises.update(UNIT1_EXERCISES)
    all_unit_exercises.update(UNIT2_EXERCISES)
    all_unit_exercises.update(UNIT3_EXERCISES)
    all_unit_exercises.update(UNIT4_EXERCISES)
    all_unit_exercises.update(UNIT5_EXERCISES)

    print(f"Total lessons in dataset to enrich: {len(all_unit_exercises)}")
    assert len(all_unit_exercises) == 25, f"Expected 25 lessons, got {len(all_unit_exercises)}"

    total_exercises_count = 0
    seen_prompts = set()

    for lesson in lessons:
        lesson_id = lesson['id']
        if lesson_id not in all_unit_exercises:
            raise KeyError(f"Missing exercises for lesson id: {lesson_id}")

        new_exercises = all_unit_exercises[lesson_id]
        assert len(new_exercises) == 15, f"Expected 15 exercises for {lesson_id}, got {len(new_exercises)}"

        # Validate each exercise
        for ex_idx, ex in enumerate(new_exercises):
            assert ex['id'], f"Exercise missing id in {lesson_id}"
            assert ex['type'] in ['multiple-choice', 'sentence-order', 'fill-in-blank'], f"Invalid type in {ex['id']}"
            assert ex['prompt'], f"Empty prompt in {ex['id']}"
            assert len(ex['options']) == 4, f"Options length should be 4 in {ex['id']}"
            assert 0 <= ex['correctAnswer'] < 4, f"Invalid correctAnswer in {ex['id']}"
            assert ex.get('explanation'), f"Empty explanation in {ex['id']}"

            # Check prompt duplication
            prompt_key = ex['prompt'].strip()
            if prompt_key in seen_prompts:
                print(f"Warning: Duplicate prompt detected: {prompt_key[:50]}...")
            seen_prompts.add(prompt_key)

        # Update step 1 (practice step)
        practice_step = None
        for step in lesson['steps']:
            if step['type'] == 'practice':
                practice_step = step
                break

        if not practice_step:
            raise ValueError(f"No practice step found in lesson {lesson_id}")

        practice_step['practiceData']['exercises'] = new_exercises
        practice_step['estimatedMinutes'] = 8  # 15 exercises ~ 8 minutes

        # Check total estimated duration
        total_step_mins = sum(s.get('estimatedMinutes', 5) for s in lesson['steps'])
        lesson['estimatedDurationMinutes'] = total_step_mins

        total_exercises_count += len(new_exercises)

    print(f"Successfully enriched all 25 lessons! Total practice exercises: {total_exercises_count}")

    # Write back japaneseLessons.json
    with open(n4_lessons_path, 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)
    print(f"Wrote updated curriculum to {n4_lessons_path}")

    # Update n4_500_mon.json
    print(f"Updating N4 500 Mon deck at: {n4_500_mon_path}")
    print(f"Total 500 Mon cards: {len(N4_500_MON_CARDS)}")
    with open(n4_500_mon_path, 'w', encoding='utf-8') as f:
        json.dump(N4_500_MON_CARDS, f, ensure_ascii=False, indent=2)
    print(f"Wrote updated 500 Mon cards to {n4_500_mon_path}")

    print("Enrichment completed successfully!")

if __name__ == '__main__':
    main()
