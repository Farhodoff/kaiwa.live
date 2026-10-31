import React from 'react';
import { KaiwaOrbCharacter, KaiwaOrbCharacterProps, OrbState } from './KaiwaOrbCharacter';

export type { OrbState, KaiwaOrbCharacterProps as ProjectOrbProps };

export const ProjectOrb: React.FC<KaiwaOrbCharacterProps> = (props) => {
  return <KaiwaOrbCharacter {...props} />;
};

export default ProjectOrb;
