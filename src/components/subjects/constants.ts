import {
  Atom,
  Beaker,
  BookOpen,
  Calculator,
  Code,
  Dumbbell,
  Globe,
  Mic,
  Music,
  Palette,
} from 'lucide-react';

export const SUBJECT_ICONS = [
  { id: 'book', Icon: BookOpen, label: 'Kitob' },
  { id: 'code', Icon: Code, label: 'IT' },
  { id: 'calculator', Icon: Calculator, label: 'Matematika' },
  { id: 'mic', Icon: Mic, label: 'Til' },
  { id: 'globe', Icon: Globe, label: 'Geografiya' },
  { id: 'science', Icon: Beaker, label: 'Kimyo' },
  { id: 'atom', Icon: Atom, label: 'Fizika' },
  { id: 'music', Icon: Music, label: 'Musiqa' },
  { id: 'art', Icon: Palette, label: "San'at" },
  { id: 'sport', Icon: Dumbbell, label: 'Sport' },
];

export const getIconComponent = (iconId?: string) => {
  const iconData = SUBJECT_ICONS.find((i) => i.id === iconId);
  return iconData ? iconData.Icon : BookOpen;
};
