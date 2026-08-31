import type { WeaponId } from '../CharacterAppearance';
import type { CharacterRenderModule } from '../rendering/CharacterRenderModule';

export const WEAPON_MODULES: Readonly<Record<WeaponId, CharacterRenderModule>> = {
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
  },
};
