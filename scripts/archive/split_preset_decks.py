import json
import re
import os

preset_decks_path = "/Users/farhod/Desktop/github/kaiwa.live/src/data/presetDecks.ts"

with open(preset_decks_path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract decks
starter_cards_match = re.search(r"id:\s*'deck_starter_a1_a2'.*?cards:\s*(\[.*?\])\n\s*\},", content, re.DOTALL)
academic_cards_match = re.search(r"id:\s*'deck_intermediate_b1_b2'.*?cards:\s*(\[.*?\])\n\s*\},", content, re.DOTALL)
c1_c2_cards_match = re.search(r"id:\s*'deck_master_c1_c2'.*?cards:\s*(\[.*?\])\n\s*\}", content, re.DOTALL)

decks_dir = "/Users/farhod/Desktop/github/kaiwa.live/src/data/decks"
os.makedirs(decks_dir, exist_ok=True)

starter_json = []
academic_json = []
c1_c2_json = []

if starter_cards_match:
    starter_json = json.loads(starter_cards_match.group(1), strict=False)
    with open(os.path.join(decks_dir, "starter.json"), "w", encoding="utf-8") as out:
        json.dump(starter_json, out, ensure_ascii=False, indent=2)
    print(f"Saved starter.json with {len(starter_json)} cards")

if academic_cards_match:
    academic_json = json.loads(academic_cards_match.group(1), strict=False)
    with open(os.path.join(decks_dir, "academic.json"), "w", encoding="utf-8") as out:
        json.dump(academic_json, out, ensure_ascii=False, indent=2)
    print(f"Saved academic.json with {len(academic_json)} cards")

if c1_c2_cards_match:
    c1_c2_json = json.loads(c1_c2_cards_match.group(1), strict=False)
    with open(os.path.join(decks_dir, "c1_c2.json"), "w", encoding="utf-8") as out:
        json.dump(c1_c2_json, out, ensure_ascii=False, indent=2)
    print(f"Saved c1_c2.json with {len(c1_c2_json)} cards")

# Write slim presetDecks.ts
slim_preset_decks_content = f'''export interface PresetCard {{
    front: string;
    back: string;
    phonetic?: string;
    example?: string;
    category?: string;
}}

export interface PresetDeck {{
    id: string;
    title: string;
    description: string;
    level: 'A1-A2' | 'B1-B2' | 'C1-C2' | 'IELTS Collocations' | 'IELTS Topics';
    badgeColor: string;
    icon: string;
    cardCount: number;
    isPremiumOnly?: boolean;
    loadCards: () => Promise<PresetCard[]>;
}}

export const PRESET_DECKS: PresetDeck[] = [
    {{
        id: 'deck_starter_a1_a2',
        title: '🌱 A1-A2 Starter Vocabulary',
        description: "Ingliz tilini noldan boshlayotganlar uchun PDF darsliklardan olingan tayanch so'zlar.",
        level: 'A1-A2',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        icon: '🌱',
        cardCount: {len(starter_json)},
        isPremiumOnly: false,
        loadCards: async () => {{
            const data = await import('./decks/starter.json');
            return data.default as PresetCard[];
        }}
    }},
    {{
        id: 'deck_intermediate_b1_b2',
        title: '📈 B1-B2 Pre-IELTS Academic Vocab',
        description: "Band 5.5-6.5 darajasidagi talabalar uchun akademik so'zlar va iboralar to'plami.",
        level: 'B1-B2',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
        icon: '📈',
        cardCount: {len(academic_json)},
        isPremiumOnly: false,
        loadCards: async () => {{
            const data = await import('./decks/academic.json');
            return data.default as PresetCard[];
        }}
    }},
    {{
        id: 'deck_master_c1_c2',
        title: '📙 C1-C2 Master IELTS Collocations',
        description: "Band 7.5-9.0 darajasidagi insholar uchun akademik birikmalar va iboralar.",
        level: 'C1-C2',
        badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        icon: '📙',
        cardCount: {len(c1_c2_json)},
        isPremiumOnly: true,
        loadCards: async () => {{
            const data = await import('./decks/c1_c2.json');
            return data.default as PresetCard[];
        }}
    }}
];
'''

with open(preset_decks_path, "w", encoding="utf-8") as out:
    out.write(slim_preset_decks_content)

print("Successfully replaced presetDecks.ts with lightweight dynamic loaders!")
