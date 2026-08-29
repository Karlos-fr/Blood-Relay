export interface PlayerControls {
  isLeftDown(): boolean;
  isRightDown(): boolean;
  isDownDown(): boolean;
  consumeJumpPressed(): boolean;
}

export function combinePlayerControls(...sources: PlayerControls[]): PlayerControls {
  return {
    isLeftDown: () => sources.some((source) => source.isLeftDown()),
    isRightDown: () => sources.some((source) => source.isRightDown()),
    isDownDown: () => sources.some((source) => source.isDownDown()),
    consumeJumpPressed: () => {
      let pressed = false;
      for (const source of sources) {
        if (source.consumeJumpPressed()) {
          pressed = true;
        }
      }
      return pressed;
    },
  };
}
