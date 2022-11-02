const linesOpacity = (raw)=> {
  return Math.pow(2, raw-6)
}

const getCurrentTimestamp = ()=>{
  return new Date().getTime()
}

module.exports = {
  linesOpacity,
  getCurrentTimestamp
}
