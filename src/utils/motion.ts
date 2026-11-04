// Motion utility definitions for the landing page
// Centralized transition presets to keep animation timing consistent
export const transitions = {
  // micro interaction (hover, tap)
  micro: { duration: 0.18, ease: 'easeOut' },
  // normal UI entrance
  normal: { duration: 0.45, ease: 'easeOut' },
  // hero entrance (larger elements)
  hero: { duration: 0.7, ease: 'easeOut' },
  // stagger delay step (used with variants)
  stagger: 0.07,
};
