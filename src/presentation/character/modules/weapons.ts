import type { WeaponId } from '../CharacterAppearance';
import { pixels, rect, type CharacterModuleDefinition } from '../moduleGeometry';

export const WEAPON_MODULES: Readonly<Record<WeaponId, CharacterModuleDefinition>> = {
  'relay-pistol': {
    id: 'relay-pistol',
    pieces: [
      {
        id: 'relay-pistol:weapon',
        slot: 'weapon',
        anchor: 'weaponMount',
        views: {
          right: [
            rect(0, -1, 7, 3, 'outline'),
            rect(1, -1, 5, 2, 'metal'),
            rect(1, 2, 2, 3, 'outline'),
            rect(1, 2, 1, 2, 'metalLight'),
            pixels(
              [
                [5, -1],
                [6, -1],
              ],
              'accent',
            ),
          ],
        },
      },
    ],
  },
};
