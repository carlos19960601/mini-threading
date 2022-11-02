export class ThreadBase {
  sampleCanvas = null

  computeNbSegments(threads) {
    return (threads.length >  1) ? threads.length-1:0
  }

  iterateOnThread(thread,  color,  fromSegmentNumber, callback) {
    const threadLength  = this.computeNbSegments(thread)
    if (fromSegmentNumber < threadLength) {
      const threadPart = thread.slice(fromSegmentNumber)
      callback(threadPart, color)
    }
  }

  lowerNbSegmentsForThread(thread, targetNumber) {
    if (targetNumber > 0) {
      thread.length = Math.min(thread.length, targetNumber+1)
    } else {
      thread.length = 0
    }
  }
}