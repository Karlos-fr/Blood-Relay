import Phaser from 'phaser';
import { GAME_VERSION } from '../app/config/game';
import { CHARACTER_VISUAL_PROFILES } from '../app/config/characters';
import { PLAYER_SPRITE_SIZE } from '../app/config/artDirection';
import { BRAND_GRAPHIC, BRAND_IDENTITY, BRAND_PALETTE } from '../app/config/brand';
import { UI_THEME } from '../app/config/uiTheme';

export class BootScene extends Phaser.Scene {
  public static readonly KEY = 'BootScene';

  constructor() {
    super({ key: BootScene.KEY });
  }

  public preload(): void {
    const playerGraphics = this.add.graphics();
    const { width, height } = PLAYER_SPRITE_SIZE;
    const createWeaponIcon = (
      textureKey: string,
      bodyColor: number,
      accentColor: number,
      markerColor: number,
      symbolColor: number,
    ): void => {
      const icon = this.add.graphics();
      icon.fillStyle(bodyColor, 0.96);
      icon.fillRoundedRect(0, 0, 34, 24, 5);
      icon.fillStyle(accentColor, 0.95);
      icon.fillRoundedRect(2, 2, 30, 20, 4);
      icon.fillStyle(markerColor, 0.85);
      icon.fillRect(8, 9, 16, 2);
      icon.fillRect(14, 5, 4, 10);
      icon.fillStyle(symbolColor, 1);
      icon.fillTriangle(10, 12, 15, 6, 15, 18);
      icon.fillTriangle(24, 12, 19, 6, 19, 18);
      icon.generateTexture(textureKey, 34, 24);
      icon.destroy();
    };

    const renderCharacterFrames = (
      prefix: string,
      fill: number,
      eyeOffset: number,
      chestOffset: number,
      eyeFill: number,
      chestFill: number,
      accentFill: number,
    ): void => {
      const frameDefinitions = [
        { label: 'idle', yOffset: 0, chestPulse: 0 },
        { label: 'idle-1', yOffset: 0, chestPulse: 0 },
        { label: 'idle-2', yOffset: 1, chestPulse: 1 },
        { label: 'run-1', yOffset: 1, chestPulse: 0 },
        { label: 'run-2', yOffset: -1, chestPulse: -1 },
        { label: 'jump', yOffset: 2, chestPulse: 2 },
        { label: 'jump-1', yOffset: 2, chestPulse: 2 },
        { label: 'jump-2', yOffset: 3, chestPulse: 3 },
        { label: 'dodge', yOffset: 3, chestPulse: 4 },
        { label: 'dodge-1', yOffset: 3, chestPulse: 4 },
        { label: 'dodge-2', yOffset: 4, chestPulse: 4 },
        { label: 'shoot', yOffset: 1, chestPulse: 0 },
        { label: 'shoot-1', yOffset: 1, chestPulse: 0 },
        { label: 'shoot-2', yOffset: 2, chestPulse: 0 },
        { label: 'melee', yOffset: 3, chestPulse: 2 },
        { label: 'melee-1', yOffset: 3, chestPulse: 2 },
        { label: 'melee-2', yOffset: 2, chestPulse: -1 },
        { label: 'hurt', yOffset: 2, chestPulse: 1 },
        { label: 'hurt-1', yOffset: 2, chestPulse: 1 },
        { label: 'hurt-2', yOffset: 2, chestPulse: 2 },
        { label: 'transfusion', yOffset: 0, chestPulse: -2 },
        { label: 'transfusion-1', yOffset: -1, chestPulse: -2 },
        { label: 'transfusion-2', yOffset: 0, chestPulse: -1 },
        { label: 'respawn', yOffset: 0, chestPulse: 0 },
        { label: 'respawn-1', yOffset: 0, chestPulse: -1 },
        { label: 'respawn-2', yOffset: 1, chestPulse: 1 },
        { label: 'death', yOffset: 4, chestPulse: 4 },
        { label: 'death-1', yOffset: 4, chestPulse: 4 },
        { label: 'death-2', yOffset: 5, chestPulse: 5 },
      ];

      frameDefinitions.forEach((frame) => {
        playerGraphics.clear();
        playerGraphics.fillStyle(fill);
        playerGraphics.fillRoundedRect(0, 0, width, height, 6);
        playerGraphics.fillStyle(eyeFill);
        playerGraphics.fillRoundedRect(11 + eyeOffset, 16 + frame.yOffset, 9, 9, 2);
        playerGraphics.fillStyle(UI_THEME.gameplay.playerFaceLight);
        playerGraphics.fillRect(14 + eyeOffset, 19 + frame.yOffset + frame.chestPulse, 3, 2);
        playerGraphics.fillStyle(chestFill);
        playerGraphics.fillRect(18 + chestOffset, 34 + frame.chestPulse, 12, 10 - frame.chestPulse);
        playerGraphics.fillStyle(accentFill);
        playerGraphics.fillRoundedRect(14, 50 + frame.yOffset, 18, 3 + (frame.label === 'idle-2' ? 1 : 0), 2);
        playerGraphics.fillRoundedRect(18, 52 + frame.yOffset * 0.15, 14, 2, 1);
        playerGraphics.generateTexture(`${prefix}-${frame.label}`, width, height);
      });
    };

    for (let index = 0; index < CHARACTER_VISUAL_PROFILES.length; index += 1) {
      const profile = CHARACTER_VISUAL_PROFILES[index];
      const variants = profile.paletteVariants.length > 0 ? profile.paletteVariants : [
        {
          id: 'base',
          label: 'Standard',
          bodyFill: profile.bodyFill,
          eyeFill: profile.eyeFill,
          chestFill: profile.chestFill,
          accentFill: profile.accentFill,
        },
      ];

      variants.forEach((variant, variantIndex) => {
        const prefix = variantIndex === 0 ? profile.spritePrefix : `${profile.spritePrefix}-${variant.id}`;
        renderCharacterFrames(
          prefix,
          variant.bodyFill,
          profile.eyeOffset,
          profile.chestOffset,
          variant.eyeFill,
          variant.chestFill,
          variant.accentFill,
        );
      });
    }

    renderCharacterFrames(
      'player',
      UI_THEME.gameplay.playerBodyFill,
      0,
      0,
      UI_THEME.gameplay.playerEyeFill,
      UI_THEME.gameplay.playerChest,
      UI_THEME.gameplay.contrastBoost,
    );

    playerGraphics.destroy();

    const projectileRevolver = this.add.graphics();
    projectileRevolver.fillStyle(UI_THEME.gameplay.projectile);
    projectileRevolver.fillRoundedRect(0, 0, 12, 4, 2);
    projectileRevolver.fillRect(0, 1, 2, 1);
    projectileRevolver.fillRect(10, 0, 1.8, 4);
    projectileRevolver.generateTexture('projectile-revolver', 12, 4);
    projectileRevolver.generateTexture('projectile', 12, 4);
    projectileRevolver.destroy();

    const projectileShotgun = this.add.graphics();
    projectileShotgun.fillStyle(0xd8d8d8);
    projectileShotgun.fillRect(0, 1, 2.2, 1.2);
    projectileShotgun.fillRect(2.8, 0, 2.2, 1.8);
    projectileShotgun.fillRect(5.4, 1.2, 2.4, 1.4);
    projectileShotgun.fillRect(8, 0.5, 2.2, 1.6);
    projectileShotgun.fillStyle(UI_THEME.gameplay.projectile, 0.7);
    projectileShotgun.fillRect(0, 2, 12, 0.8);
    projectileShotgun.generateTexture('projectile-shotgun', 12, 4);
    projectileShotgun.destroy();

    const projectileGrenade = this.add.graphics();
    projectileGrenade.fillStyle(0x5c4a33);
    projectileGrenade.fillCircle(3, 2, 2.2);
    projectileGrenade.fillStyle(0x94764a, 0.95);
    projectileGrenade.fillCircle(3, 2, 1.2);
    projectileGrenade.fillStyle(0xb6c5d8, 0.9);
    projectileGrenade.fillRect(2, 0, 2, 4);
    projectileGrenade.generateTexture('projectile-grenade', 8, 4);
    projectileGrenade.destroy();

    const projectilePerforant = this.add.graphics();
    projectilePerforant.fillStyle(0x9b9fa8);
    projectilePerforant.fillRoundedRect(0, 1, 20, 2, 1);
    projectilePerforant.fillStyle(0xd0d7df, 0.85);
    projectilePerforant.fillRect(18, 1.6, 2.4, 0.8);
    projectilePerforant.fillStyle(0xfff5c8, 0.86);
    projectilePerforant.fillRect(0, 1.8, 0.8, 0.4);
    projectilePerforant.generateTexture('projectile-perforant', 20, 4);
    projectilePerforant.destroy();

    const projectileSaw = this.add.graphics();
    projectileSaw.fillStyle(0x8f8f8f);
    projectileSaw.fillRoundedRect(0, 0, 8, 4, 1);
    projectileSaw.fillStyle(0xc6d2da, 0.85);
    projectileSaw.fillRect(0, 0.2, 8, 3.6);
    projectileSaw.fillStyle(0xffebbc, 0.82);
    projectileSaw.fillRect(3, 0.8, 2, 2.4);
    projectileSaw.fillStyle(0x4f5e72, 0.8);
    projectileSaw.fillCircle(6, 2, 0.8);
    projectileSaw.generateTexture('projectile-scie', 8, 4);
    projectileSaw.destroy();

    createWeaponIcon('weapon-icon-revolver', UI_THEME.gameplay.projectile, 0x22252d, 0xffce65, 0xffefc6);
    createWeaponIcon('weapon-icon-shotgun', 0xd8d8d8, 0x292d31, 0xffe2a0, 0xfff2cc);
    createWeaponIcon('weapon-icon-smg', 0x6f7b88, 0x2f3237, 0xffd07f, 0xfff0b8);
    createWeaponIcon('weapon-icon-crossbow', 0xe2d7be, 0x3b382f, 0xfff0c7, 0xfff5d6);
    createWeaponIcon('weapon-icon-grenade', 0x6a523f, 0x2f261c, 0xffb17a, 0xffdbab);
    createWeaponIcon('weapon-icon-perforant', 0xa3b4cf, 0x2f3440, 0xfff2a8, 0xfff9ce);
    createWeaponIcon('weapon-icon-scie', 0x7a4c37, 0x29272f, 0xffb17a, 0xffc9a4);
    createWeaponIcon('weapon-icon-machette', 0x6e5342, 0x2f2a22, 0xffb17a, 0xffdbab);

    const melee = this.add.graphics();
    melee.fillStyle(UI_THEME.gameplay.melee, 0.85);
    melee.fillEllipse(0, 16, 54, 28);
    melee.generateTexture('melee', 54, 32);
    melee.destroy();

    const meleeHit = this.add.graphics();
    meleeHit.fillStyle(UI_THEME.gameplay.melee, 0.85);
    meleeHit.fillEllipse(0, 16, 36, 20);
    meleeHit.fillEllipse(14, 8, 18, 7);
    meleeHit.fillEllipse(24, 16, 8, 12);
    meleeHit.lineStyle(1, 0xffecb3, 0.85);
    meleeHit.strokeEllipse(0, 16, 38, 22);
    meleeHit.generateTexture('melee-hit', 54, 32);
    meleeHit.destroy();

    const muzzleFlash = this.add.graphics();
    muzzleFlash.fillStyle(0xfff0ab, 0.9);
    muzzleFlash.fillTriangle(0, 6, 22, 1, 18, 11);
    muzzleFlash.fillStyle(0xffcc64, 0.95);
    muzzleFlash.fillTriangle(6, 6, 21, 3.5, 21, 8.5);
    muzzleFlash.fillStyle(0xffe5a5, 0.4);
    muzzleFlash.fillCircle(6, 6, 2.5);
    muzzleFlash.generateTexture('muzzle-flash', 22, 12);
    muzzleFlash.destroy();

    const muzzleFlashRevolver = this.add.graphics();
    muzzleFlashRevolver.fillStyle(0xfff0ab, 0.95);
    muzzleFlashRevolver.fillTriangle(0, 6, 30, 2, 30, 10);
    muzzleFlashRevolver.fillTriangle(24, 6, 30, 2, 30, 10);
    muzzleFlashRevolver.fillStyle(0xffdc70, 0.4);
    muzzleFlashRevolver.fillCircle(6, 6, 2.4);
    muzzleFlashRevolver.generateTexture('muzzle-flash-revolver', 30, 12);
    muzzleFlashRevolver.clear();
    muzzleFlashRevolver.fillStyle(0xfff8c7, 0.78);
    muzzleFlashRevolver.fillTriangle(0, 6, 30, 2, 30, 10);
    muzzleFlashRevolver.fillTriangle(12, 6, 30, 2, 30, 10);
    muzzleFlashRevolver.fillStyle(0xffe8a0, 0.7);
    muzzleFlashRevolver.fillCircle(14, 6, 3.3);
    muzzleFlashRevolver.fillStyle(0xffe8a0, 0.2);
    muzzleFlashRevolver.fillCircle(6, 6, 4.5);
    muzzleFlashRevolver.generateTexture('muzzle-flash-revolver-pulse', 30, 12);
    muzzleFlashRevolver.destroy();

    const muzzleFlashShotgun = this.add.graphics();
    muzzleFlashShotgun.fillStyle(0xffecb9, 0.95);
    muzzleFlashShotgun.fillTriangle(0, 6, 38, 0, 38, 12);
    muzzleFlashShotgun.fillStyle(0xffdd74, 0.6);
    muzzleFlashShotgun.fillTriangle(4, 6, 34, 1.4, 34, 10.6);
    muzzleFlashShotgun.fillStyle(0xffe8a4, 0.4);
    muzzleFlashShotgun.fillEllipse(12, 6, 14, 5);
    muzzleFlashShotgun.generateTexture('muzzle-flash-shotgun', 38, 12);
    muzzleFlashShotgun.clear();
    muzzleFlashShotgun.fillStyle(0xfff5cd, 0.82);
    muzzleFlashShotgun.fillTriangle(0, 6, 38, 0, 38, 12);
    muzzleFlashShotgun.fillStyle(0xffe39b, 0.72);
    muzzleFlashShotgun.fillTriangle(6, 6, 31, 1.6, 31, 10.4);
    muzzleFlashShotgun.fillStyle(0xffe3a2, 0.35);
    muzzleFlashShotgun.fillEllipse(18, 6, 16, 6);
    muzzleFlashShotgun.generateTexture('muzzle-flash-shotgun-pulse', 38, 12);
    muzzleFlashShotgun.destroy();

    const muzzleFlashSmg = this.add.graphics();
    muzzleFlashSmg.fillStyle(0xffe29d, 0.95);
    muzzleFlashSmg.fillTriangle(0, 6, 28, 0, 28, 12);
    muzzleFlashSmg.fillStyle(0xffd36a, 0.6);
    muzzleFlashSmg.fillTriangle(6, 6, 24, 2.4, 24, 9.6);
    muzzleFlashSmg.fillStyle(0xffe6a6, 0.4);
    muzzleFlashSmg.fillRect(0, 5.5, 12, 1.2);
    muzzleFlashSmg.fillRect(2, 5, 22, 2);
    muzzleFlashSmg.generateTexture('muzzle-flash-smg', 28, 12);
    muzzleFlashSmg.clear();
    muzzleFlashSmg.fillStyle(0xfff3ce, 0.82);
    muzzleFlashSmg.fillTriangle(0, 6, 28, 0, 28, 12);
    muzzleFlashSmg.fillStyle(0xffdd8a, 0.7);
    muzzleFlashSmg.fillTriangle(10, 6, 28, 1.2, 28, 10.8);
    muzzleFlashSmg.fillStyle(0xffe1a5, 0.24);
    muzzleFlashSmg.fillCircle(12, 6, 4.8);
    muzzleFlashSmg.generateTexture('muzzle-flash-smg-pulse', 28, 12);
    muzzleFlashSmg.destroy();

    const crossbowBolt = this.add.graphics();
    crossbowBolt.fillStyle(0xdeccb2, 1);
    crossbowBolt.fillRoundedRect(0, 4, 30, 4, 1);
    crossbowBolt.fillStyle(0xe2f0ff, 0.9);
    crossbowBolt.fillRect(27, 2.5, 3, 7);
    crossbowBolt.generateTexture('projectile-crossbow', 30, 12);
    crossbowBolt.destroy();

    const crossbowBoltImpact = this.add.graphics();
    crossbowBoltImpact.fillStyle(0xbeb5a1, 1);
    crossbowBoltImpact.fillRoundedRect(0, 3.5, 22, 5, 1.5);
    crossbowBoltImpact.fillStyle(0xc3d3e2, 0.8);
    crossbowBoltImpact.fillRect(0, 0, 30, 12);
    crossbowBoltImpact.fillRect(8, 3, 2, 6);
    crossbowBoltImpact.generateTexture('projectile-crossbow-embedded', 30, 12);
    crossbowBoltImpact.destroy();

    const muzzleFlashCrossbow = this.add.graphics();
    muzzleFlashCrossbow.fillStyle(0xffe8b4, 0.95);
    muzzleFlashCrossbow.fillTriangle(0, 6, 34, 0, 34, 12);
    muzzleFlashCrossbow.fillStyle(0xffdca0, 0.6);
    muzzleFlashCrossbow.fillTriangle(4, 6, 30, 2, 30, 10);
    muzzleFlashCrossbow.fillStyle(0xffebad, 0.36);
    muzzleFlashCrossbow.fillRect(0, 5.2, 18, 1.6);
    muzzleFlashCrossbow.fillRect(4, 4.8, 20, 2.4);
    muzzleFlashCrossbow.generateTexture('muzzle-flash-crossbow', 34, 12);
    muzzleFlashCrossbow.clear();
    muzzleFlashCrossbow.fillStyle(0xfff2ca, 0.82);
    muzzleFlashCrossbow.fillTriangle(0, 6, 34, 0, 34, 12);
    muzzleFlashCrossbow.fillStyle(0xffdfa7, 0.75);
    muzzleFlashCrossbow.fillTriangle(12, 6, 34, 1.4, 34, 10.6);
    muzzleFlashCrossbow.fillStyle(0xffe7b1, 0.25);
    muzzleFlashCrossbow.fillCircle(16, 6, 5.2);
    muzzleFlashCrossbow.generateTexture('muzzle-flash-crossbow-pulse', 34, 12);
    muzzleFlashCrossbow.destroy();

    const muzzleFlashPerforant = this.add.graphics();
    muzzleFlashPerforant.fillStyle(0xffefc5, 0.95);
    muzzleFlashPerforant.fillTriangle(0, 6, 44, 0, 44, 12);
    muzzleFlashPerforant.fillStyle(0xffdb88, 0.6);
    muzzleFlashPerforant.fillTriangle(4, 6, 38, 1.8, 38, 10.2);
    muzzleFlashPerforant.fillStyle(0xffe09a, 0.37);
    muzzleFlashPerforant.fillRect(0, 5.1, 20, 1.8);
    muzzleFlashPerforant.fillRect(4, 4.4, 24, 3.2);
    muzzleFlashPerforant.generateTexture('muzzle-flash-perforant', 44, 12);
    muzzleFlashPerforant.clear();
    muzzleFlashPerforant.fillStyle(0xfff6d8, 0.84);
    muzzleFlashPerforant.fillTriangle(0, 6, 44, 0, 44, 12);
    muzzleFlashPerforant.fillStyle(0xffe6a3, 0.74);
    muzzleFlashPerforant.fillTriangle(10, 6, 44, 1.4, 44, 10.6);
    muzzleFlashPerforant.fillStyle(0xffe6a3, 0.28);
    muzzleFlashPerforant.fillCircle(18, 6, 5.5);
    muzzleFlashPerforant.generateTexture('muzzle-flash-perforant-pulse', 44, 12);
    muzzleFlashPerforant.destroy();

    const muzzleFlashScie = this.add.graphics();
    muzzleFlashScie.fillStyle(0xffddb5, 0.95);
    muzzleFlashScie.fillTriangle(0, 6, 30, 0, 30, 12);
    muzzleFlashScie.fillStyle(0xffc76b, 0.62);
    muzzleFlashScie.fillTriangle(6, 6, 30, 2, 30, 10);
    muzzleFlashScie.fillStyle(0xffde9a, 0.38);
    muzzleFlashScie.fillRect(0, 5, 14, 2);
    muzzleFlashScie.fillRect(2, 4.5, 18, 3);
    muzzleFlashScie.generateTexture('muzzle-flash-scie', 30, 12);
    muzzleFlashScie.clear();
    muzzleFlashScie.fillStyle(0xfff4cc, 0.8);
    muzzleFlashScie.fillTriangle(0, 6, 30, 0, 30, 12);
    muzzleFlashScie.fillStyle(0xffdd9a, 0.72);
    muzzleFlashScie.fillTriangle(8, 6, 30, 1.5, 30, 10.5);
    muzzleFlashScie.fillStyle(0xffe3ac, 0.26);
    muzzleFlashScie.fillCircle(14, 6, 5);
    muzzleFlashScie.generateTexture('muzzle-flash-scie-pulse', 30, 12);
    muzzleFlashScie.destroy();

    if (!this.anims.exists('anim-muzzle-flash-revolver')) {
      this.anims.create({
        key: 'anim-muzzle-flash-revolver',
        frames: [
          { key: 'muzzle-flash-revolver' },
          { key: 'muzzle-flash-revolver-pulse' },
          { key: 'muzzle-flash-revolver' },
        ],
        frameRate: 48,
        repeat: 0,
      });
    }

    if (!this.anims.exists('anim-muzzle-flash-shotgun')) {
      this.anims.create({
        key: 'anim-muzzle-flash-shotgun',
        frames: [
          { key: 'muzzle-flash-shotgun' },
          { key: 'muzzle-flash-shotgun-pulse' },
          { key: 'muzzle-flash-shotgun' },
        ],
        frameRate: 46,
        repeat: 0,
      });
    }

    if (!this.anims.exists('anim-muzzle-flash-smg')) {
      this.anims.create({
        key: 'anim-muzzle-flash-smg',
        frames: [
          { key: 'muzzle-flash-smg' },
          { key: 'muzzle-flash-smg-pulse' },
          { key: 'muzzle-flash-smg' },
        ],
        frameRate: 70,
        repeat: 0,
      });
    }

    if (!this.anims.exists('anim-muzzle-flash-crossbow')) {
      this.anims.create({
        key: 'anim-muzzle-flash-crossbow',
        frames: [
          { key: 'muzzle-flash-crossbow' },
          { key: 'muzzle-flash-crossbow-pulse' },
          { key: 'muzzle-flash-crossbow' },
        ],
        frameRate: 44,
        repeat: 0,
      });
    }

    if (!this.anims.exists('anim-muzzle-flash-perforant')) {
      this.anims.create({
        key: 'anim-muzzle-flash-perforant',
        frames: [
          { key: 'muzzle-flash-perforant' },
          { key: 'muzzle-flash-perforant-pulse' },
          { key: 'muzzle-flash-perforant' },
        ],
        frameRate: 52,
        repeat: 0,
      });
    }

    if (!this.anims.exists('anim-muzzle-flash-scie')) {
      this.anims.create({
        key: 'anim-muzzle-flash-scie',
        frames: [
          { key: 'muzzle-flash-scie' },
          { key: 'muzzle-flash-scie-pulse' },
          { key: 'muzzle-flash-scie' },
        ],
        frameRate: 70,
        repeat: 0,
      });
    }

    const interactionZone = this.add.graphics();
    interactionZone.fillStyle(UI_THEME.gameplay.interactionFill, 0.85);
    interactionZone.fillRoundedRect(0, 0, 32, 32, 8);
    interactionZone.lineStyle(2, UI_THEME.gameplay.interactionStroke, 0.95);
    interactionZone.strokeRoundedRect(0, 0, 32, 32, 8);
    interactionZone.generateTexture('interaction-zone', 32, 32);
    interactionZone.destroy();

    const bloodSplat = this.add.graphics();
    bloodSplat.fillStyle(0x7a1818, 1);
    bloodSplat.fillCircle(12, 9, 6);
    bloodSplat.fillEllipse(12, 12, 11, 7);
    bloodSplat.fillEllipse(7, 7, 4, 3);
    bloodSplat.fillCircle(17, 16, 2.6);
    bloodSplat.fillCircle(15, 16, 2);
    bloodSplat.fillRect(4, 12, 5, 2.8);
    bloodSplat.fillRect(16, 3, 4, 2);
    bloodSplat.fillRect(1, 14, 3, 4.5);
    bloodSplat.generateTexture('blood-splat', 24, 24);
    bloodSplat.destroy();

    const bloodSplatLarge = this.add.graphics();
    bloodSplatLarge.fillStyle(0x7a1818, 1);
    bloodSplatLarge.fillCircle(14, 14, 9);
    bloodSplatLarge.fillEllipse(14, 15, 18, 11);
    bloodSplatLarge.fillEllipse(6, 12, 4.5, 3.5);
    bloodSplatLarge.fillEllipse(20, 16, 5.5, 4.5);
    bloodSplatLarge.fillEllipse(10, 22, 5, 3);
    bloodSplatLarge.fillCircle(18, 7, 3.2);
    bloodSplatLarge.fillRect(2, 14, 6, 4.5);
    bloodSplatLarge.fillRect(20, 9, 3.8, 4);
    bloodSplatLarge.fillRect(14, 2, 4, 2.5);
    bloodSplatLarge.generateTexture('blood-splat-large', 30, 30);
    bloodSplatLarge.destroy();

    const bloodWallMark = this.add.graphics();
    bloodWallMark.fillStyle(0x7a1818, 1);
    bloodWallMark.fillEllipse(14, 5, 14, 3.7);
    bloodWallMark.fillEllipse(6, 5, 4.2, 1.8);
    bloodWallMark.fillEllipse(20, 5, 5.4, 2);
    bloodWallMark.fillRect(0, 3.4, 6, 1.5);
    bloodWallMark.fillRect(22, 4, 4.5, 1.7);
    bloodWallMark.generateTexture('blood-wall-mark', 28, 12);
    bloodWallMark.destroy();

    const bloodTrace = this.add.graphics();
    bloodTrace.fillStyle(0x7a1818, 1);
    bloodTrace.fillEllipse(22, 2.5, 20, 3.2);
    bloodTrace.fillEllipse(9, 2.3, 5.3, 1.9);
    bloodTrace.fillEllipse(16, 2.8, 4.1, 1.5);
    bloodTrace.fillEllipse(28, 2.5, 2.7, 1.2);
    bloodTrace.generateTexture('blood-trace', 44, 6);
    bloodTrace.destroy();

    const bloodFlash = this.add.graphics();
    bloodFlash.fillStyle(0xffffff, 1);
    bloodFlash.fillCircle(12, 12, 10);
    bloodFlash.fillCircle(12, 6, 3.2);
    bloodFlash.fillCircle(6, 12, 2.5);
    bloodFlash.fillCircle(18, 13, 2);
    bloodFlash.fillStyle(0x7a1818, 0.14);
    bloodFlash.fillCircle(12, 12, 7.5);
    bloodFlash.generateTexture('blood-flash', 24, 24);
    bloodFlash.destroy();

    const panel = this.add.graphics();
    panel.fillStyle(UI_THEME.scene.panel.outer, 1);
    panel.fillRoundedRect(0, 0, 320, 180, 12);
    panel.fillStyle(UI_THEME.scene.panel.inner, 0.25);
    panel.fillRoundedRect(6, 6, 308, 168, 10);
    panel.lineStyle(2, UI_THEME.scene.shadow, 0.7);
    panel.strokeRoundedRect(0, 0, 320, 180, 12);
    panel.lineStyle(1, 0x84b7f9, 0.6);
    panel.strokeRoundedRect(3, 3, 314, 174, 11);
    panel.generateTexture('ui-panel-large', 320, 180);
    panel.destroy();

    const panelStrip = this.add.graphics();
    panelStrip.fillStyle(UI_THEME.scene.panel.outer, 1);
    panelStrip.fillRoundedRect(0, 0, 280, 58, 10);
    panelStrip.fillStyle(UI_THEME.scene.panel.inner, 0.2);
    panelStrip.fillRoundedRect(2, 2, 276, 54, 8);
    panelStrip.lineStyle(2, UI_THEME.scene.shadow, 0.9);
    panelStrip.strokeRoundedRect(0, 0, 280, 58, 10);
    panelStrip.generateTexture('ui-panel-strip', 280, 58);
    panelStrip.destroy();

    const button = this.add.graphics();
    button.fillStyle(UI_THEME.scene.panel.inner, 0.82);
    button.fillRoundedRect(0, 0, 190, 44, 10);
    button.fillStyle(UI_THEME.scene.panel.outer, 0.25);
    button.fillRoundedRect(1, 1, 188, 10, 9);
    button.lineStyle(2, UI_THEME.scene.panel.inner, 0.5);
    button.strokeRoundedRect(0, 0, 190, 44, 10);
    button.generateTexture('ui-button', 190, 44);
    button.destroy();

    const buttonActive = this.add.graphics();
    buttonActive.fillStyle(UI_THEME.scene.panel.outer, 0.88);
    buttonActive.fillRoundedRect(0, 0, 190, 44, 10);
    buttonActive.fillStyle(UI_THEME.scene.panel.inner, 0.34);
    buttonActive.fillRoundedRect(1, 1, 188, 10, 9);
    buttonActive.lineStyle(2, 0x9bd0ff, 0.92);
    buttonActive.strokeRoundedRect(0, 0, 190, 44, 10);
    buttonActive.generateTexture('ui-button-active', 190, 44);
    buttonActive.destroy();

    const keycap = this.add.graphics();
    keycap.fillStyle(0x101927, 0.95);
    keycap.fillRoundedRect(0, 0, 66, 30, 6);
    keycap.fillStyle(0x2f4560, 0.55);
    keycap.fillRoundedRect(2, 2, 62, 10, 5);
    keycap.lineStyle(1, UI_THEME.scene.panel.inner, 0.8);
    keycap.strokeRoundedRect(0, 0, 66, 30, 6);
    keycap.generateTexture('ui-keycap', 66, 30);
    keycap.destroy();

    const logo = this.add.graphics();
    logo.fillStyle(BRAND_PALETTE.logo.background, 1);
    logo.fillRoundedRect(0, 0, 340, 90, 12);
    logo.fillStyle(BRAND_PALETTE.logo.mark, 0.95);
    logo.fillRoundedRect(16, 10, 40, 18, 4);
    logo.fillEllipse(26, 27, 16, 7);
    logo.fillStyle(BRAND_PALETTE.logo.markGlow, 1);
    logo.fillTriangle(44, 14, 58, 22, 44, 30);
    logo.fillTriangle(300, 28, 324, 10, 324, 46);
    logo.fillStyle(BRAND_PALETTE.logo.accent, 0.9);
    logo.fillRect(82, 54, 11, 10);
    logo.fillCircle(87, 54, 8);
    logo.fillCircle(94, 46, 5);
    logo.fillCircle(102, 52, 4.5);
    logo.fillStyle(UI_THEME.gameplay.projectile, 0.85);
    logo.fillRect(60, 18, 56, 9);
    logo.fillRect(116, 22, 11, 14);
    logo.generateTexture('ui-brand-mark', BRAND_GRAPHIC.logo.width, BRAND_GRAPHIC.logo.height);
    logo.destroy();

    const panelGrid = this.add.graphics();
    panelGrid.fillStyle(0x192539, 0.18);
    panelGrid.fillRect(0, 0, 80, 80);
    panelGrid.fillStyle(0x0f1d2f, 0.45);
    panelGrid.fillPoint(12, 12, 2);
    panelGrid.fillPoint(12, 40, 2);
    panelGrid.fillPoint(56, 24, 2);
    panelGrid.fillPoint(40, 64, 2);
    panelGrid.generateTexture('ui-grid-snare', 80, 80);
    panelGrid.destroy();

    const platform = this.add.graphics();
    platform.fillStyle(UI_THEME.gameplay.platform);
    platform.fillRect(0, 0, 300, 24);
    platform.generateTexture('platform', 300, 24);
    platform.destroy();
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(UI_THEME.scene.bootBackground);
    const title = this.add
      .text(640, 176, BRAND_IDENTITY.name, {
        fontSize: '52px',
        color: UI_THEME.text.titleMuted,
        fontFamily: UI_THEME.font.title,
      })
      .setOrigin(0.5, 0.5)
      .setShadow(1, 2, UI_THEME.scene.shadow, UI_THEME.font.shadow - 2)
      .setAlpha(0);

    const versionText = this.add
      .text(640, 218, `Version ${GAME_VERSION}`, {
        fontSize: '20px',
        color: UI_THEME.text.secondary,
        fontFamily: UI_THEME.font.body,
      })
      .setOrigin(0.5, 0)
      .setAlpha(0);

    const loadingText = this.add
      .text(640, 248, 'Chargement de la version prototype...', {
        fontSize: '18px',
        color: UI_THEME.text.link,
        fontFamily: UI_THEME.font.body,
      })
      .setOrigin(0.5, 0)
      .setAlpha(0);

    const emblem = this.add
      .image(640, 76, 'ui-brand-mark')
      .setScale(1.38)
      .setAlpha(0);

    const panel = this.add.image(640, 318, 'ui-panel-strip').setScale(3.7, 0.72).setAlpha(0);
    const grid = this.add.image(640, 334, 'ui-grid-snare').setScale(11.4, 1.8).setAlpha(0);

    const descriptor = this.add
      .text(640, 330, BRAND_IDENTITY.shortDescription, {
        fontSize: '15px',
        color: UI_THEME.text.bodyDim,
        fontFamily: UI_THEME.font.body,
      })
      .setOrigin(0.5, 0.5)
      .setAlpha(0);

    const shine = this.add.graphics();
    shine.fillStyle(0xffffff, 0.18);
    shine.fillRect(-220, -2, 120, 54);
    shine.setPosition(860, 292);
    shine.setScale(2.8, 1.4);
    shine.setAlpha(0.35);
    shine.setRotation(-0.06);

    this.tweens.add({
      targets: [emblem, title, versionText, loadingText, panel, grid, descriptor],
      delay: 80,
      duration: BRAND_GRAPHIC.logoRevealDurationMs,
      alpha: 1,
      y: '+=4',
      ease: 'Back.Out',
    });

    this.tweens.add({
      targets: emblem,
      scaleX: 1.38 * BRAND_GRAPHIC.logoPulseScale,
      scaleY: 1.38 * BRAND_GRAPHIC.logoPulseScale,
      duration: BRAND_GRAPHIC.logoPulseDurationMs,
      delay: 140,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: loadingText,
      alpha: 0.35,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: shine,
      x: 470,
      alpha: 0.02,
      duration: 650,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });

    this.time.delayedCall(BRAND_GRAPHIC.introDurationMs, () => {
      this.scene.start('MenuScene');
    });
  }
}
