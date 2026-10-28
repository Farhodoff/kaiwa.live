# -*- coding: utf-8 -*-
"""
Cross-Level Vocabulary & Deck Deduplication:
1. Deduplicates vocabulary items across N5 -> N4 -> N3 -> N2 -> N1 in:
   - src/data/vocab/jlptVocab{N5,N4,N3,N2,N1}.json
   - public/data/vocab/jlptVocab{N5,N4,N3,N2,N1}.json
   Assigns each word to its earliest, foundational level.
   Merges rich definitions, translations, and examples from higher duplicates before removing them.
2. Deduplicates flashcards across n5 -> n4 -> n3 -> n2 -> n1 in:
   - src/data/decks/jlpt_{n5,n4,n3,n2,n1}.json
   Assigns each card to its foundational level so that learners never study
   duplicate words across multiple JLPT decks.
"""

import json
import os

VOCAB_LEVELS = ["N5", "N4", "N3", "N2", "N1"]
DECK_LEVELS = ["n5", "n4", "n3", "n2", "n1"]

def deduplicate_vocab():
    print("=== Deduplicating JLPT Vocabulary Datasets ===")
    vocabs = {}
    for lvl in VOCAB_LEVELS:
        path = f"src/data/vocab/jlptVocab{lvl}.json"
        with open(path, "r", encoding="utf-8") as f:
            vocabs[lvl] = json.load(f)

    seen_keys = {}
    deduped_vocabs = {lvl: [] for lvl in VOCAB_LEVELS}
    enrichment_count = 0
    removed_count = 0

    for lvl in VOCAB_LEVELS:
        for item in vocabs[lvl]:
            w = item.get("word", "").strip()
            r = item.get("reading", "").strip()
            key = (w, r)

            if key not in seen_keys:
                seen_keys[key] = (lvl, item)
                deduped_vocabs[lvl].append(item)
            else:
                prev_lvl, prev_item = seen_keys[key]
                removed_count += 1

                # Enrich previous item if current has better/longer meaning or more examples
                curr_meaning = item.get("meaningUz", "").strip()
                prev_meaning = prev_item.get("meaningUz", "").strip()
                if len(curr_meaning) > len(prev_meaning) and "tushunchasi, ilmiy" not in curr_meaning:
                    prev_item["meaningUz"] = curr_meaning
                    enrichment_count += 1

                curr_examples = item.get("examples", [])
                prev_examples = prev_item.get("examples", [])
                if len(curr_examples) > len(prev_examples):
                    prev_item["examples"] = curr_examples
                    enrichment_count += 1

                if not prev_item.get("partOfSpeech") and item.get("partOfSpeech"):
                    prev_item["partOfSpeech"] = item.get("partOfSpeech")
                    enrichment_count += 1

                if not prev_item.get("romaji") and item.get("romaji"):
                    prev_item["romaji"] = item.get("romaji")
                    enrichment_count += 1

    print(f"Total unique vocabulary words: {len(seen_keys)}")
    print(f"Total cross-level duplicates removed: {removed_count}")
    print(f"Total enrichments merged into foundation levels: {enrichment_count}")

    for lvl in VOCAB_LEVELS:
        src_path = f"src/data/vocab/jlptVocab{lvl}.json"
        pub_path = f"public/data/vocab/jlptVocab{lvl}.json"
        items = deduped_vocabs[lvl]

        with open(src_path, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)

        os.makedirs(os.path.dirname(pub_path), exist_ok=True)
        with open(pub_path, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)

        print(f"  {lvl}: {len(vocabs[lvl])} -> {len(items)} items")

def deduplicate_decks():
    print("\n=== Deduplicating JLPT Master Flashcard Decks ===")
    decks = {}
    for lvl in DECK_LEVELS:
        path = f"src/data/decks/jlpt_{lvl}.json"
        with open(path, "r", encoding="utf-8") as f:
            decks[lvl] = json.load(f)

    seen_fronts = {}
    deduped_decks = {lvl: [] for lvl in DECK_LEVELS}
    deck_removed = 0

    for lvl in DECK_LEVELS:
        for card in decks[lvl]:
            f_norm = card.get("front", "").strip()
            if not f_norm:
                continue

            if f_norm not in seen_fronts:
                seen_fronts[f_norm] = (lvl, card)
                deduped_decks[lvl].append(card)
            else:
                prev_lvl, prev_card = seen_fronts[f_norm]
                deck_removed += 1
                # Merge richer example or back if present
                if len(card.get("example", "")) > len(prev_card.get("example", "")):
                    prev_card["example"] = card["example"]
                if len(card.get("back", "")) > len(prev_card.get("back", "")):
                    prev_card["back"] = card["back"]

    print(f"Total unique flashcards: {len(seen_fronts)}")
    print(f"Total cross-level deck duplicates removed: {deck_removed}")

    for lvl in DECK_LEVELS:
        path = f"src/data/decks/jlpt_{lvl}.json"
        cards = deduped_decks[lvl]
        with open(path, "w", encoding="utf-8") as f:
            json.dump(cards, f, ensure_ascii=False, indent=2)
        print(f"  jlpt_{lvl}: {len(decks[lvl])} -> {len(cards)} cards")

if __name__ == "__main__":
    deduplicate_vocab()
    deduplicate_decks()
