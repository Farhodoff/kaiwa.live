# -*- coding: utf-8 -*-
"""
Apply N3 Enrichment:
1. Injects 10 authentic practice exercises into each of the 30 N3 lessons (total 300 exercises)
2. Preserves critical Choukai audio tracks on ja-n3-u3-l5-e1 and ja-n3-u6-l1-e1
3. Shuffles options deterministically for realistic answer distribution (0, 1, 2, 3)
4. Enriches N3 decks: n3_500_mon.json (60 cards) and n3_confusing_grammar.json (45 cards)
"""

import json
import random
import hashlib

from scripts.n3_data.unit1 import UNIT1_EXERCISES
from scripts.n3_data.unit2 import UNIT2_EXERCISES
from scripts.n3_data.unit3 import UNIT3_EXERCISES
from scripts.n3_data.unit4 import UNIT4_EXERCISES
from scripts.n3_data.unit5 import UNIT5_EXERCISES
from scripts.n3_data.unit6 import UNIT6_EXERCISES
from scripts.n3_data.n3_decks_data import ADDITIONAL_500_MON_CARDS, ADDITIONAL_CONFUSING_GRAMMAR_CARDS

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
    for u in [UNIT1_EXERCISES, UNIT2_EXERCISES, UNIT3_EXERCISES, UNIT4_EXERCISES, UNIT5_EXERCISES, UNIT6_EXERCISES]:
        all_units.update(u)
    
    print(f"Loaded {len(all_units)} lessons of practice exercises.")
    assert len(all_units) == 30, f"Expected 30 lessons, got {len(all_units)}"

    # 2. Update japaneseLessons.json
    lessons_path = "src/data/curriculum/levels/n3/japaneseLessons.json"
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
        else:
            raise ValueError(f"Missing exercises for {lid}")

    with open(lessons_path, "w", encoding="utf-8") as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)
    print(f"Updated {lessons_path} with {total_exercises} practice exercises.")

    # 3. Update n3_500_mon.json
    deck1_path = "src/data/decks/n3_500_mon.json"
    with open(deck1_path, "r", encoding="utf-8") as f:
        deck1 = json.load(f)
    
    # Avoid duplicating if already applied
    existing_fronts = {c["front"] for c in deck1}
    added_deck1 = 0
    for card in ADDITIONAL_500_MON_CARDS:
        if card["front"] not in existing_fronts:
            deck1.append(card)
            existing_fronts.add(card["front"])
            added_deck1 += 1
            
    with open(deck1_path, "w", encoding="utf-8") as f:
        json.dump(deck1, f, ensure_ascii=False, indent=2)
    print(f"Updated {deck1_path}: added {added_deck1} cards, total {len(deck1)} cards.")

    # 4. Update n3_confusing_grammar.json
    deck2_path = "src/data/decks/n3_confusing_grammar.json"
    with open(deck2_path, "r", encoding="utf-8") as f:
        deck2 = json.load(f)

    existing_fronts_2 = {c["front"] for c in deck2}
    added_deck2 = 0
    for card in ADDITIONAL_CONFUSING_GRAMMAR_CARDS:
        if card["front"] not in existing_fronts_2:
            deck2.append(card)
            existing_fronts_2.add(card["front"])
            added_deck2 += 1

    with open(deck2_path, "w", encoding="utf-8") as f:
        json.dump(deck2, f, ensure_ascii=False, indent=2)
    print(f"Updated {deck2_path}: added {added_deck2} cards, total {len(deck2)} cards.")

if __name__ == "__main__":
    main()
