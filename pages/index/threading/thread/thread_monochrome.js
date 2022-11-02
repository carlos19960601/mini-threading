import { Color_MONOCHROME, MONOCHROME } from "../../parameters"
import {ThreadBase}  from  "./thread"

export class ThreadMonochrome extends ThreadBase {
  threadPegs = []
  
  get totalNbSegments() {
    return this.computeNbSegments(this.threadPegs)
  } 

  adjustCanvasData(data, blackBackground) {
    let computeAdjustedValue
    if (blackBackground) {
      computeAdjustedValue = (rawValue) => (255-rawValue)/2
    } else  {
      computeAdjustedValue = (rawValue) => rawValue/2
    }

    const nbPixels = data.length/4
    for (let i = 0;  i < nbPixels; i++)  {
      const averageSourceValue = (data[4*i+0] + data[4*i+1] + data[4*i+2]) / 3
      const adjustedValue = computeAdjustedValue(averageSourceValue)
      data[4*i+0] = adjustedValue
      data[4*i+1] = adjustedValue
      data[4*i+2] = adjustedValue
    }
  }

  getThreadGrow() {
    return {
      thread: this.threadPegs,
      color: Color_MONOCHROME,
    }
  }

  enableSamplingFor() {
    if (this.sampleCanvas === null) {
      this.sampleCanvas = (data, index) =>{
        return data[index+0]
      }
    }
  }

  iterateOnThreads(nbSegmentsToIgnore, callback) {
    super.iterateOnThread(this.threadPegs, Color_MONOCHROME, nbSegmentsToIgnore, callback)
  }

  lowerNbSegments(targetNumber) {
    super.lowerNbSegmentsForThread(this.threadPegs, targetNumber)
  }
}