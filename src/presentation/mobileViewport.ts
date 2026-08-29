export interface ContainedViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export function selectViewportSize(
  visualWidth: number | undefined,
  visualHeight: number | undefined,
  innerWidth: number,
  innerHeight: number,
): ViewportSize {
  const width = visualWidth && visualWidth > 0 ? visualWidth : innerWidth;
  const height = visualHeight && visualHeight > 0 ? visualHeight : innerHeight;

  return { width, height };
}

export function calculateContainedViewport(
  containerWidth: number,
  containerHeight: number,
  contentWidth: number,
  contentHeight: number,
): ContainedViewport {
  const zoom = Math.min(containerWidth / contentWidth, containerHeight / contentHeight);
  const width = contentWidth * zoom;
  const height = contentHeight * zoom;

  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
    zoom,
  };
}
