export interface MobileInputCapabilities {
  maxTouchPoints: number;
  coarsePointer: boolean;
  hoverNone: boolean;
}

export function detectMobileInput(capabilities: MobileInputCapabilities): boolean {
  return (
    capabilities.maxTouchPoints > 0 && capabilities.coarsePointer && capabilities.hoverNone
  );
}

export function isMobileDevice(): boolean {
  return detectMobileInput({
    maxTouchPoints: navigator.maxTouchPoints,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    hoverNone: window.matchMedia('(hover: none)').matches,
  });
}
