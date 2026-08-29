export interface ContainedViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
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
