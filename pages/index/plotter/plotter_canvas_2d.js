import  {applyCanvasCompositing, resetCanvasCompositing}  from  './compositing'

export class PlotterCanvas2D  {
  constructor(pageThis) {
    this.pageThis = pageThis
    wx.createSelectorQuery()
    .select("#preview-canvas")
    .fields({node: true, size: true})
    .exec((res)=>{
      this.canvas = res[0].node
      this.context = this.canvas.getContext('2d', {alpha: false})

      const dpr = wx.getSystemInfoSync().pixelRatio
      this.canvas.width = res[0].width * dpr
      this.canvas.height = res[0].height * dpr
      this.context.scale(dpr, dpr)
      this.cssPixel = dpr

      this.canvas.requestAnimationFrame(this.pageThis.renderLoop)
    })
  }

  get size() {
    return {
      width: Math.floor(this.canvas.width/this.cssPixel),
      height: Math.floor(this.canvas.height/this.cssPixel),
    }
  }

  resize() {

  }

  initialize(infos) {
    this.context.fillStyle = infos.backgroundColor
    this.context.lineJoin = "round";
    resetCanvasCompositing(this.context);
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  drawPoints(points, color, diameter) {
    if (points.length > 0) {
      this.context.fillStyle = color
      this.context.strokeStyle =  "none"
      for (const point of points)  {
        this.context.beginPath()
        this.context.arc(
          point.x , 
          point.y , 
          0.5 * diameter, 
          0, 
          2 * Math.PI)
        this.context.fill();
        this.context.closePath();
      }
    }
  }

  drawBrokenLine(points, color, opacity, operation, thickness) {
    const lines = []
    for (let i = 0; i < points.length-1;i++) {
      lines.push({from: points[i], to: points[i+1]})
    }
    this.drawLines(lines, color, opacity, operation, thickness)    
  }

  drawLines(lines, color, opacity, operation, thickness) {
    if (lines.length >= 1) {
      applyCanvasCompositing(this.context, color, opacity, operation)
      this.context.lineWidth  = thickness 

      for (const line of lines) {
        this.context.beginPath()
        this.context.moveTo(line.from.x, line.from.y)
        this.context.lineTo(line.to.x, line.to.y)
        this.context.stroke();
        this.context.closePath();
      }

      resetCanvasCompositing(this.context);
    }
  }

  finalize(){}
}