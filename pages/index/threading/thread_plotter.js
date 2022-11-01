const app = getApp()

export class ThreadPlotter  {
  nbSegmentDrawn =  0

  constructor(plotter,  threadComputer){
    this.plotter =  plotter
    this.threadComputer =  threadComputer
  }

  plot() {
    if (this.nbSegmentDrawn === this.threadComputer.nbSegments) {
      return
    } else if (this.nbSegmentDrawn >  this.threadComputer.nbSegments)  {
      this.nbSegmentDrawn = 0
    }

    const drawFromScratch = (this.nbSegmentDrawn ===  0)
    if (drawFromScratch) {
      const plotterInfos = {
        backgroundColor: app.globalData.invertColors ? "black" : "white",
        blur: app.globalData.blur,
      }
      this.plotter.resize()
      this.plotter.initialize(plotterInfos)

      if (app.globalData.displayPegs) {
        this.threadComputer.drawPegs(this.plotter)
      }

      this.threadComputer.drawThread(this.plotter, 0)
      this.plotter.finalize();
    } else {
      this.threadComputer.drawThread(this.plotter, this.nbSegmentDrawn)
    }
  }

  reset() {
    this.nbSegmentsDrawn = 0;
  }
}