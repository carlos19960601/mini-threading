import { Color_MONOCHROME,  Color_BLUE, Color_GREEN,Color_RED, LIGHTEN } from "../parameters"

// 绘制在hiddenCanvas上时，targetOperation = lighter
// 会知道renderCanvas上时，targetOperation = difference
export function applyCanvasCompositing(context, color, opacity, operation) {
  const rawRGB = computeRawColor(color)
  const targetOperation = (operation === LIGHTEN) ? "lighter" : "difference";

  context.globalCompositeOperation = targetOperation
  if (context.globalCompositeOperation === targetOperation) {
    const value = Math.ceil(255*opacity)
    context.strokeStyle = `rgb(${rawRGB.r * value}, ${rawRGB.g * value}, ${rawRGB.b * value})`
    return
  }
}


function computeRawColor(color) {
  if (color === Color_MONOCHROME)  {
    return {r:1, g:1, b:1}
}

  return {
    r: (color === Color_RED) ? 1:0,
    g: (color === Color_BLUE) ? 1: 0,
    b: (color === Color_BLUE) ? 1:  0
  }
}


export const resetCanvasCompositing = (context)=>{
  context.globalCompositeOperation =  "source-over"
}