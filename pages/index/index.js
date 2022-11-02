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
        threadComputer.sourceImage.src = res.tempFiles[0].tempFilePath
        that.setData({
          pictureURL: res.tempFiles[0].tempFilePath
        })
      }
    })
  },
  changeSegmentCount: function(e) {
    app.globalData.nbLines = e.detail.value
  },
  onReady: async function(){
    canvasPlotter = new PlotterCanvas2D()
    await canvasPlotter.init()
    threadComputer = new ThreadComputer(()=>{
      needReset = true
      canvasPlotter.canvas.requestAnimationFrame(this.renderLoop)
    })
    threadPlotter = new ThreadPlotter(canvasPlotter, threadComputer)
  },

  renderLoop: function(){
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
    canvasPlotter.canvas.requestAnimationFrame(this.renderLoop)
  }
})