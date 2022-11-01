import {ThreadComputer} from './threading/thread_computer'
import {PlotterCanvas2D} from  './plotter/plotter_canvas_2d'
import {ThreadPlotter}  from './threading/thread_plotter'
import {linesOpacity}  from  '../../utils/util'
// index.js
// 获取应用实例
const app = getApp()
const MAX_COMPUTING_TIME_PER_FRAME = 20; // ms

let canvasPlotter
let threadComputer 
let threadPlotter
let needReset = false

Page({
  data: {
    pictureURL: "/images/cat.jpg"
  },
  choosePicture: function(){
    var that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      success: (res)=>{
        that.setData({
          pictureURL: res.tempFiles[0].tempFilePath
        })
        threadComputer.sourceImage.src = res.tempFiles[0].tempFilePath
      }
    })
  },
 
  onReady: function(){
    threadComputer = new ThreadComputer(()=>{needReset = true})
    canvasPlotter = new PlotterCanvas2D(this)
    threadPlotter  = new ThreadPlotter(canvasPlotter, threadComputer)
  },

  renderLoop: function(){
    console.log("renderLoop")
    if (needReset) {
      threadComputer.reset(linesOpacity(
        app.globalData.linesOpacity), 
        app.globalData.linesThickness,
      )
      threadPlotter.reset()
      needReset = false
    }

    const computedSomething = threadComputer.computeNextSegments(MAX_COMPUTING_TIME_PER_FRAME)

    threadPlotter.plot()
    console.log("rendering")
    canvasPlotter.canvas.requestAnimationFrame(this.renderLoop)
  }
})