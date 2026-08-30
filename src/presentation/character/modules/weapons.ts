import type { WeaponId } from '../CharacterAppearance';
import { pixels, rect } from '../moduleGeometry';
import type { LegacyCompatibleCharacterRenderModule } from '../rendering/CharacterRenderModule';

export const WEAPON_MODULES: Readonly<Record<WeaponId, LegacyCompatibleCharacterRenderModule>> = {
  'relay-pistol': {
    id: 'relay-pistol',
    layer: 'weapon',
    renderRight({ canvas, pose }) {
      const mount = pose.weaponMount;
      canvas.drawLine(pose.handFront, mount, 'outline');
      canvas.setPixel(pose.handFront.x, pose.handFront.y, 'metalDark');

      const barrelEnd = Math.min(canvas.width - 1, mount.x + 7);
      canvas.fillRect(mount.x, mount.y - 1, barrelEnd - mount.x + 1, 3, 'outline');
      canvas.fillRect(mount.x + 1, mount.y - 1, Math.max(1, barrelEnd - mount.x - 1), 2, 'metal');
      canvas.fillRect(mount.x + 1, mount.y + 2, 2, 3, 'outline');
      canvas.setPixel(mount.x + 1, mount.y + 2, 'metalLight');
      canvas.setPixel(barrelEnd, mount.y - 1, 'accent');
    },
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
