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
    pictureURL: "/images/cat.jpg",
    drawPercent: 0,
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
  changeOpacity: function(e) {
    app.globalData.linesOpacity = e.detail.value
    needReset = true
  },
  changeThickness: function(e) {
    app.globalData.linesThickness = e.detail.value
    needReset = true
  },
  changeShape: function(e)  {
    app.globalData.shape = e.detail.value
    needReset = true
  },
  changePegsCount: function(e) {
    app.globalData.pegsCount = e.detail.value
    needReset = true
  },
  changeQuality: function(e) {
    app.globalData.hiddenCanvasScale = e.detail.value
    needReset = true
  },
  savePicture: function() {
    wx.canvasToTempFilePath({
      canvas: threadPlotter.plotter.canvas,
      fileType:"jpg",
      success: (res)=>{
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
        })
      },
    })
  },
  acquireInstructions: function() {
    wx.showToast({
      title: '正在开发中...',
      icon: "none",
    })
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
  onShareAppMessage: function(){
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

    if (computedSomething)  {
      this.setData({
        drawPercent: threadComputer.nbSegments * 100 /app.globalData.nbLines
      })
    }

    threadPlotter.plot()
    canvasPlotter.canvas.requestAnimationFrame(this.renderLoop)
  }
})