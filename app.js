// app.js
App({
  onLaunch() {
  
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
