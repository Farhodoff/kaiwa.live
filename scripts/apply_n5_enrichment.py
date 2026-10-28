# -*- coding: utf-8 -*-
"""
Apply N5 Enrichment:
1. Injects 15 authentic practice exercises into each of the 25 N5 lessons (total 375 exercises)
2. Preserves / integrates Choukai audio tracks on ja-n5-u3-l5 (exercises and test questions)
3. Shuffles options deterministically for realistic answer distribution (0, 1, 2, 3)
4. Enriches N5 test bank deck: n5_test_bank.json (from 33 to 70 cards)
"""

import json
import random
import hashlib

from scripts.n5_data.unit1 import UNIT1_EXERCISES
from scripts.n5_data.unit2 import UNIT2_EXERCISES
from scripts.n5_data.unit3 import UNIT3_EXERCISES
from scripts.n5_data.unit4 import UNIT4_EXERCISES
from scripts.n5_data.unit5 import UNIT5_EXERCISES
from scripts.n5_data.n5_decks_data import ADDITIONAL_N5_TEST_BANK_CARDS

def balance_options(exercise):
    """
    Deterministically permute options so that the correct answer is not always at index 0.
    """
    options = list(exercise['options'])
    correct_idx = exercise['correctAnswer']
    correct_val = options[correct_idx]
    
    # Use MD5 hash of exercise ID as deterministic seed
    seed = int(hashlib.md5(exercise['id'].encode('utf-8')).hexdigest(), 16)
    rng = random.Random(seed)
    
    # Shuffle options
    rng.shuffle(options)
    
    new_correct_idx = options.index(correct_val)
    
    ex_copy = dict(exercise)
    ex_copy['options'] = options
    ex_copy['correctAnswer'] = new_correct_idx
    return ex_copy

def main():
    # 1. Combine all unit exercises
    all_units = {}
    for u in [UNIT1_EXERCISES, UNIT2_EXERCISES, UNIT3_EXERCISES, UNIT4_EXERCISES, UNIT5_EXERCISES]:
        all_units.update(u)
    
    print(f"Loaded {len(all_units)} lessons of N5 practice exercises.")
    assert len(all_units) == 25, f"Expected 25 lessons, got {len(all_units)}"

    # 2. Update japaneseLessons.json
    lessons_path = "src/data/curriculum/levels/n5/japaneseLessons.json"
    with open(lessons_path, "r", encoding="utf-8") as f:
        lessons = json.load(f)

    total_exercises = 0
    for lesson in lessons:
        lid = lesson["id"]
        if lid in all_units:
            raw_exercises = all_units[lid]
            processed_exercises = [balance_options(ex) for ex in raw_exercises]
            
            # Find practice step
            practice_step = next((s for s in lesson["steps"] if s["type"] == "practice"), None)
            if practice_step:
                if "practiceData" not in practice_step or practice_step["practiceData"] is None:
                    practice_step["practiceData"] = {}
                practice_step["practiceData"]["exercises"] = processed_exercises
                total_exercises += len(processed_exercises)
            else:
                raise ValueError(f"No practice step in {lid}")
            
            # Add audio to test questions in ja-n5-u3-l5
            if lid == "ja-n5-u3-l5":
                test_step = next((s for s in lesson["steps"] if s["type"] == "test"), None)
                if test_step and test_step.get("testData", {}).get("questions"):
                    audio_tracks = [
                        "/audio/choukai/n5/minna_shokyu_1_006.mp3",
                        "/audio/choukai/n5/minna_shokyu_1_007.mp3",
                        "/audio/choukai/n5/minna_shokyu_1_008.mp3",
                        "/audio/choukai/n5/minna_shokyu_1_009.mp3",
                    ]
                    for idx, q in enumerate(test_step["testData"]["questions"]):
                        if idx < len(audio_tracks):
                            q["audioUrl"] = audio_tracks[idx]
                            q["audioTitle"] = f"N5 Listening Test Track 0{idx+6}"
        else:
            raise ValueError(f"Missing exercises for {lid}")

    with open(lessons_path, "w", encoding="utf-8") as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)
    print(f"Updated {lessons_path} with {total_exercises} practice exercises.")

    # 3. Update n5_test_bank.json
    deck_path = "src/data/decks/n5_test_bank.json"
    with open(deck_path, "r", encoding="utf-8") as f:
        deck = json.load(f)
    
    existing_fronts = {c["front"] for c in deck}
    added_cards = 0
    for card in ADDITIONAL_N5_TEST_BANK_CARDS:
        if card["front"] not in existing_fronts:
            deck.append(card)
            existing_fronts.add(card["front"])
            added_cards += 1
            
    with open(deck_path, "w", encoding="utf-8") as f:
        json.dump(deck, f, ensure_ascii=False, indent=2)
    print(f"Updated {deck_path}: added {added_cards} cards, total {len(deck)} cards.")

if __name__ == "__main__":
    main()
