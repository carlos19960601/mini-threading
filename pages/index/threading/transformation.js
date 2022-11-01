export class Transformation {
  constructor(frameSize,  elementSize) {
    const scaleToFitWidth = frameSize.width / elementSize.width;
    const scaleToFitHeight = frameSize.height / elementSize.height;

    this.scaling = Math.min(scaleToFitWidth, scaleToFitHeight);
    this.origin = {
        x: 0.5 * (frameSize.width - this.scaling * elementSize.width),
        y: 0.5 * (frameSize.height - this.scaling * elementSize.height)
    };
  }

  transform(point) {
    return {
        x: this.origin.x + point.x * this.scaling,
        y: this.origin.y + point.y * this.scaling,
    };
  }
}