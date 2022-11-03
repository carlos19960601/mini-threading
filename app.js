// app.js
App({
  onLaunch() {
    // 检测新版本
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
  },
  globalData: {
    hiddenCanvasScale: 3, //  quality 1:Low 2:Medium 3:High
    mode: "0", // 0:Monochrome 1:Three colors
    invertColors: false, // black background
    shape: "1", // 0: rectangle 1: Ellipsis
    pegsCount: 200,  // 钉子数量
    linesOpacity: 4 ,  // [1,5]
    linesThickness: 0.25, // [0.25,1]
    nbLines: 300, //  [500,15000]
    displayPegs: true,
  }
})
