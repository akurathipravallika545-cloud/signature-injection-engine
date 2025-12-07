export function toNormalized(viewportRect /* {left, top, width, height} */, pageViewportSize /* {w, h} */) {
  return {
    xPct: viewportRect.left / pageViewportSize.w,
    yPct: viewportRect.top / pageViewportSize.h,
    wPct: viewportRect.width / pageViewportSize.w,
    hPct: viewportRect.height / pageViewportSize.h
  };
}
