import {MONOCHROME, RECTANGLE, LIGHTEN, DARKEN}  from  "../parameters"
import { applyCanvasCompositing } from "../plotter/compositing";
import {ThreadMonochrome} from  "./thread/thread_monochrome"
import {resetCanvasCompositing}  from  '../plotter/compositing'
import {Transformation} from './transformation'
import {getCurrentTimestamp} from '../../../utils/util'

const app = getApp()
const TWO_PI = 2 * Math.PI;
const MIN_SAFE_NUMBER = -9007199254740991;

export class ThreadComputer {
  get nbSegments(){
    return this.thread.totalNbSegments
  }

  constructor(imageOnload) {
    this.hiddenCanvas = wx.createOffscreenCanvas({type: '2d'})
    this.hiddenCanvasCtx = this.hiddenCanvas.getContext('2d')
   
    this.sourceImage =  this.hiddenCanvas.createImage()
    this.sourceImage.src = '/images/cat.jpg'
    this.sourceImage.onload = imageOnload
  }

  reset(opacity, lineThickness) {
    this.lineOpacity = opacity
    this.lineThickness = lineThickness
    this.hiddenCanvasScale = app.globalData.hiddenCanvasScale  // quality

    if (app.globalData.mode === MONOCHROME) {
      this.thread = new ThreadMonochrome()
    } 

    this.resetHiddenCanvas()
    this.pegs = this.computePegs()
  }

  resetHiddenCanvas() {
    const wantedSize  = computeBestSize(this.sourceImage, 100 * this.hiddenCanvasScale)
    this.hiddenCanvas.width = wantedSize.width
    this.hiddenCanvas.height = wantedSize.height
   
    resetCanvasCompositing(this.hiddenCanvasCtx)
    this.hiddenCanvasCtx.drawImage(this.sourceImage, 0, 0, wantedSize.width, wantedSize.height)

    const imageData = this.hiddenCanvasCtx.getImageData(0, 0, wantedSize.width, wantedSize.height)
    this.thread.adjustCanvasData(imageData.data, app.globalData.invertColors)
    this.hiddenCanvasCtx.putImageData(imageData, 0, 0)
    this.initializeHiddenCanvasLineProperties()
  }

  computePegs() {
    let domainSize
    {
      const DEFAULT_CANVAS_SIZE_FOR_PEGS = 1000;
      const aspectRatio = this.hiddenCanvas.width / this.hiddenCanvas.height;
      if (aspectRatio > 1)  {
        domainSize = { 
          width: DEFAULT_CANVAS_SIZE_FOR_PEGS, 
          height: Math.round(DEFAULT_CANVAS_SIZE_FOR_PEGS / aspectRatio),
        }
      } else {
        domainSize = { 
          width: Math.round(DEFAULT_CANVAS_SIZE_FOR_PEGS * aspectRatio), 
          height: DEFAULT_CANVAS_SIZE_FOR_PEGS, 
        }
      }
    }

    const pegsShape  = app.globalData.shape
    const pegsCount = app.globalData.pegsCount

    const pegs =  []
    if (pegsShape === RECTANGLE)  {
      this.arePegsTooClose = (peg1, peg2) =>{
        return peg1.x === peg2.x || peg1.y ===  peg2.y
      }
      
      const maxX = domainSize.width
      const maxY = domainSize.height

      const aspectRatio = maxY / maxX
      const nbPegsPerWidth = Math.round(0.5*pegsCount / (1+aspectRatio))  // width边上有多少个pegs
      const nbPegsPerHeight = Math.round(0.5*(pegsCount - 2 * nbPegsPerWidth)) // height边上有多少个pegs

      pegs.push({ x: 0, y: 0 });
      for (let iw = 1; iw < nbPegsPerWidth; iw++)  {
        pegs.push({x: maxX*(iw/nbPegsPerWidth), y: 0})
      }

      pegs.push({x: maxX, y: 0})

      for  (let ih = 1; ih < nbPegsPerHeight; ih++){
        pegs.push({x:maxX, y: maxY *(ih/nbPegsPerHeight)})
      }

      pegs.push({x:maxX, y:maxY})

      for (let iw = nbPegsPerWidth-1; iw>=1; iw--) {
        pegs.push({x:maxX *(iw/nbPegsPerWidth),  y: maxY})
      }

      pegs.push({x:0, y:maxY})

      for (let ih = nbPegsPerHeight-1; ih>=1; ih--){
        pegs.push({x:0, y:maxY*(ih/nbPegsPerHeight)})
      }
    } else {
      this.arePegsTooClose = (peg1,  peg2) =>{
        const absDeltaAngle  = Math.abs(peg1.angle-peg2.angle)
        const minAngle = Math.min(absDeltaAngle,  TWO_PI - absDeltaAngle)
        return  minAngle <= TWO_PI / 16
      }

      const halfWidth = 0.5  * domainSize.width
      const halfHeight = 0.5*domainSize.height
      // 拉马努金 椭圆周长估计
      const circumference = Math.PI * (3 * (halfWidth + halfHeight) - Math.sqrt((3 * halfWidth + halfHeight) * (halfWidth + 3 * halfHeight)))
      const distanceBetweenPegs = circumference / pegsCount;

      let angle = 0
      while(pegs.length < pegsCount) {
        const cosAngle = Math.cos(angle)
        const sinAngle = Math.sin(angle)

        // 和数学坐标不同，这个angle是顺时针走的
        const peg = {
          x: halfWidth*(1+cosAngle),
          y: halfHeight*(1+sinAngle),
          angle
        }
        pegs.push(peg)

        // 计算角度=弧长/半径 这个的半径是近似的，当相邻2点很近时，看作是在一个圆上
        const deltaAngle = distanceBetweenPegs / Math.sqrt(halfWidth * halfWidth * sinAngle * sinAngle + halfHeight * halfHeight * cosAngle * cosAngle)
        angle += deltaAngle
      }
    }

    // 从domain的坐标映射到hiddenCanvas上
    for (const pegs of  pegs)  {
      pegs.x *= this.hiddenCanvas.width / domainSize.width
      pegs.y *= this.hiddenCanvas.height/domainSize.height
    }

    return pegs
  }

  initializeHiddenCanvasLineProperties() {
    const theoricalThicknes = this.lineThickness * this.hiddenCanvasScale

    if (theoricalThicknes <= 1) {
      this.lineOpacityInternal = 0.5 * this.lineOpacity * theoricalThicknes
      this.hiddenCanvasCtx.lineWidth = 1;
    } else {
      this.lineOpacityInternal = 0.5 * this.lineOpacity;
      this.hiddenCanvasCtx.lineWidth = theoricalThicknes;
    }
  }

  computeNextSegments(maxMillisecondsTaken) {
    const start  = getCurrentTimestamp()

    const targetNbSegments = app.globalData.nbLines;
    if (this.nbSegments === targetNbSegments) {
      return false
    } else if (this.nbSegments > targetNbSegments) {
      // 移除多余的thread peg
      this.thread.lowerNbSegments(targetNbSegments)

      this.resetHiddenCanvas();
      this.thread.iterateOnThreads(0, (thread, color) =>{
        applyCanvasCompositing(this.hiddenCanvasCtx, color, this.lineOpacityInternal, LIGHTEN);

        for (let iPeg = 0; iPeg + 1 < thread.length; iPeg++) {
          this.drawSegmentOnHiddenCanvas(thread[iPeg], thread[iPeg + 1]);
        }
      })
      return true
    }

    let lastColor = null
    while (this.nbSegments < targetNbSegments 
      && getCurrentTimestamp() - start < maxMillisecondsTaken)  {
      const threadToGrow  = this.thread.getThreadGrow()
      if (lastColor !== threadToGrow.color) {
        applyCanvasCompositing(this.hiddenCanvasCtx, threadToGrow.color,  this.lineOpacityInternal, LIGHTEN)
        this.thread.enableSamplingFor(threadToGrow.color)
        lastColor = threadToGrow.color
      }
      this.computeSegment(threadToGrow.thread)
    }

    return true
  }

  computeSegment(thread) {
    let lastPeg, nextPeg
    if (thread.length === 0) {
      const startingSegment = this.computeBestStartingSegment()
      thread.push(startingSegment.peg1)
      lastPeg = startingSegment.peg1
      nextPeg = startingSegment.peg2
    } else {
      lastPeg = thread[thread.length-1]
      const HISTORY_SIZE = Math.min(thread.length, 20);
      const previousPegs = thread.slice(-HISTORY_SIZE)
      nextPeg = this.computeBestNextPeg(lastPeg, previousPegs)
    }

    thread.push(nextPeg)
    this.drawSegmentOnHiddenCanvas(lastPeg,  nextPeg)
  }

  drawSegmentOnHiddenCanvas(peg1, peg2) {
    this.hiddenCanvasCtx.beginPath()
    this.hiddenCanvasCtx.moveTo(peg1.x, peg1.y)
    this.hiddenCanvasCtx.lineTo(peg2.x, peg2.y)
    this.hiddenCanvasCtx.stroke()
    this.hiddenCanvasCtx.closePath()

    this.hiddenCanvasData = null
  }


  computeBestNextPeg(currentPeg, pegsToAvoids) {
    let candidates  = []
    let bestScore = MIN_SAFE_NUMBER

    for (const peg of this.pegs) {
      if (!this.arePegsTooClose(currentPeg, peg) && !pegsToAvoids.includes(peg))  {
        const candidateScore = this.computeSegmentPotential(currentPeg, peg)
        if (candidateScore > bestScore)  {
          bestScore = candidateScore
          candidates = [peg]
        }  else if  (candidateScore ===  bestScore) {
          candidates.push(peg)
        }
      }
    }

    return randomItem(candidates)
  }

  computeBestStartingSegment(){
    let candidates = []
    let bestScore = MIN_SAFE_NUMBER

    const step = 1 + Math.floor(this.pegs.length/100)
    for (let pegId1 = 0; pegId1 < this.pegs.length; pegId1 += step) {
      for (let pegId2 = pegId1+1; pegId2 < this.pegs.length; pegId2 += step) {
        const peg1 =  this.pegs[pegId1]
        const peg2  =  this.pegs[pegId2]

        if (!this.arePegsTooClose(peg1, peg2)) {
          const candidateScore = this.computeSegmentPotential(peg1, peg2)
          if (candidateScore > bestScore) {
            bestScore = candidateScore
            candidates = [{peg1, peg2}]
          } else if (candidateScore  === bestScore) {
            candidates.push({peg1,peg2})
          }
        }
      }
    }

    return randomItem(candidates);
  }

  computeSegmentPotential(peg1, peg2) {
    this.uploadCanvasDataToCPU()
    let potential  = 0

    const segmentLength = distance(peg1, peg2);
    const nbSamples = Math.ceil(segmentLength)
    for (let iSample = 0; iSample < nbSamples; iSample++) {
      const r = (iSample + 1) / (nbSamples + 1)
      const sample = {
        x: mix(peg1.x, peg2.x, r),
        y: mix(peg1.y, peg2.y, r),
      }

      const imageValue = this.sampleCanvasData(sample)
      const finalValue = imageValue + (this.lineOpacityInternal*255)
      const contribution = 127 - finalValue;
      potential += contribution;
    }

    return potential/nbSamples
  }

  sampleCanvasData(coords) {
    const width = this.hiddenCanvasData.width
    const height = this.hiddenCanvasData.height

    const minX = clamp(Math.floor(coords.x), 0, width-1)
    const maxX = clamp(Math.ceil(coords.x), 0, width-1)
    const minY = clamp(Math.floor(coords.y), 0, height-1)
    const maxY = clamp(Math.ceil(coords.y), 0, height-1)

    const topLeft = this.sampleCanvasPixel(minX, minY)
    const topRight = this.sampleCanvasPixel(maxX, minY)
    const bottomLeft = this.sampleCanvasPixel(minX, maxY)
    const bottomRight = this.sampleCanvasPixel(maxX, maxY)

    const fractX = coords.x % 1
    const top = mix(topLeft, topRight, fractX);
    const bottom = mix(bottomLeft, bottomRight, fractX);

    const fractY = coords.y % 1;
    return mix(top, bottom, fractY);
  }

  sampleCanvasPixel(pixelX, pixelY) {
    const index = 4*(pixelX+pixelY*this.hiddenCanvasData.width)
    return this.thread.sampleCanvas(this.hiddenCanvasData.data, index)
  }

  uploadCanvasDataToCPU() {
    if (this.hiddenCanvasData == null)  {
      const width =  this.hiddenCanvas.width
      const height = this.hiddenCanvas.height
      this.hiddenCanvasData = this.hiddenCanvasCtx.getImageData(0, 0, width, height)
    }
  }

  drawPegs(plotter){
    const transformation = this.computeTransformation(plotter.size)
    const pointSize = 0.5 * (transformation.scaling * this.hiddenCanvasScale);

    const points  = []
    for (const peg of this.pegs) {
      points.push(transformation.transform(peg))
    }

    plotter.drawPoints(points, "red", pointSize)
  }  

  computeTransformation(targetSize) {
    return new Transformation(targetSize, this.hiddenCanvas)
  }

  drawThread(plotter, nbSegmentsToIgnore)  {
    const transformation  =  this.computeTransformation(plotter.size)
    const lineWidth = (transformation.scaling * this.hiddenCanvasScale) * this.lineThickness;
    const compositing = app.globalData.invertColors ? LIGHTEN : DARKEN

    this.thread.iterateOnThreads(nbSegmentsToIgnore, (thread, color) =>{
      const points  = []
      for (const peg of thread) {
        points.push(transformation.transform(peg))
      }

      plotter.drawBrokenLine(points, color, this.lineOpacity, compositing, lineWidth);
    })
  }
}

// 将长边和maxSize对齐，短边按比例放大
const computeBestSize = (image, maxSize)=>{
  const maxSourceSide = Math.max(image.width, image.height)
  const sizeFactor = maxSize / maxSourceSide

  return {
    width: Math.ceil(image.width*sizeFactor), 
    height: Math.ceil(image.height*sizeFactor),
  }
}



const distance = (p1, p2)=>{
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx*dx+dy*dy)
}

const mix = (a, b, x) => {
  return a*(1-x) + b * x
}

const clamp  = (x, min, max) =>{
  if (x < min) {
    return min
  } else if (x > max) {
    return max
  }

  return x
}

const randomItem  = (list)=>{
  if (list.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * list.length)
  return list[randomIndex]
}