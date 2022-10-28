// index.js
// 获取应用实例
const app = getApp()
let threadComputer


class ThreadComputer {
  constructor() {
    this.hiddenCanvas = wx.createOffscreenCanvas()
    this.hiddenCanvasCtx = this.hiddenCanvas.getContext('2d')
  }
}


Page({
  data: {
   
  },
  onReady: ()=>{
    threadComputer = new ThreadComputer()
  }
})
