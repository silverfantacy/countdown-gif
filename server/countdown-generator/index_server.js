'use strict';

const fs = require('fs');
const path = require('path');
const GIFEncoder = require('gifencoder');
const { Canvas, registerFont } = require('canvas');
const moment = require('moment');

registerFont('../fonts/NotoSansTC-Medium.ttf', { family: 'Noto Sans TC' });

module.exports = {
  /**
   * Initialise the GIF generation
   * @param {string} time
   * @param {number} width
   * @param {number} height
   * @param {string} color
   * @param {string} bg
   * @param {string} name
   * @param {number} frames
   * @param {requestCallback} cb - The callback that is run once complete.
   */
  init: function (time, width = 645, height = 120, color = 'ffffff', bg = '000000', name = 'default', frames = 30, cb) {
    this.width = this.clamp(width, 150, 645);
    this.height = this.clamp(height, 120, 500);
    this.frames = this.clamp(frames, 1, 90);
    this.name = name;

    this.encoder = new GIFEncoder(this.width, this.height);
    this.canvas = new Canvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
    let timeResult = this.time(time);
    this.encode(timeResult, cb);
  },
  /**
   * Limit a value between a min / max
   * @link http://stackoverflow.com/questions/11409895/whats-the-most-elegant-way-to-cap-a-number-to-a-segment
   * @param number - input number
   * @param min - minimum value number can have
   * @param max - maximum value number can have
   * @returns {number}
   */
  clamp: function (number, min, max) {
    return Math.max(min, Math.min(number, max));
  },
  /**
   * Calculate the diffeence between timeString and current time
   * @param {string} timeString
   * @returns {string|Object} - return either the date passed string, or a valid moment duration object
   */
  time: function (timeString) {
    // grab the current and target time
    let target = moment(timeString);
    let current = moment();

    // difference between the 2 (in ms)
    let difference = target.diff(current);

    // either the date has passed, or we have a difference
    if (difference <= 0) {
      return 'Date has passed!';
    } else {
      // duration of the difference
      return moment.duration(difference);
    }
  },
  /**
   * Encode the GIF with the information provided by the time function
   * @param {string|Object} timeResult - either the date passed string, or a valid moment duration object
   * @param {requestCallback} cb - the callback to be run once complete
   */
  encode: function (timeResult, cb) {
    let enc = this.encoder;
    let ctx = this.ctx;
    let tmpDir = process.cwd() + '/tmp/';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    let filePath = tmpDir + this.name + '.gif';
    let imageStream = enc.createReadStream().pipe(fs.createWriteStream(filePath));
    imageStream.on('finish', () => {
      typeof cb === 'function' && cb();

      setTimeout(() => {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(err)
            return
          }
        });
      }, 2000);
    });

    // let fontSize = Math.floor(this.width / 12) + 'px';
    // let fontFamily = 'Courier New';
    // ctx.font = [fontSize, fontFamily].join(' ');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    enc.transparent = '#000000'; // 設定黑色為透明
    enc.start();
    enc.setRepeat(0);
    enc.setDelay(1000);
    enc.setQuality(10);

    var rectWidth = (this.width - 10 * 3) / 4;
    var rectHeight = this.height;
    var numSize = 16 * 3;
    var textSize = 16 * 1.5;
    let timeUnits = ["日", "時", "分", "秒"];
    if (typeof timeResult === 'object') {
      for (let i = 0; i < this.frames; i++) {
        let days = Math.floor(timeResult.asDays());
        let hours = Math.floor(timeResult.asHours() - (days * 24));
        let minutes = Math.floor(timeResult.asMinutes()) - (days * 24 * 60) - (hours * 60);
        let seconds = Math.floor(timeResult.asSeconds()) - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);

        days = (days.toString().length == 1) ? '0' + days : days;
        hours = (hours.toString().length == 1) ? '0' + hours : hours;
        minutes = (minutes.toString().length == 1) ? '0' + minutes : minutes;
        seconds = (seconds.toString().length == 1) ? '0' + seconds : seconds;

        let timeData = [days, hours, minutes, seconds];

        if (days < 0) {
          timeData = ['00', '00', '00', '00'];
        }

        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = "#1e54a3";
          ctx.fillRect(i * (rectWidth + 10), 0, rectWidth, rectHeight);
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.font = `${numSize}px blod Arial`;
          ctx.fillText(timeData[i], i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2 - 10);
          ctx.font = `${textSize}px "Noto Sans TC"`;
          ctx.fillText(timeUnits[i], i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2 + numSize - 15);
        }
        enc.addFrame(ctx);
        timeResult.subtract(1, 's');
      }
      enc.finish();
    } else {
      let timeData = ['00', '00', '00', '00'];

      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = "#1e54a3";
        ctx.fillRect(i * (rectWidth + 10), 0, rectWidth, rectHeight);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = `${numSize}px blod Arial`;
        ctx.fillText(timeData[i], i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2 - 10);
        ctx.font = `${textSize}px Noto Sans CJK TC`;
        ctx.fillText(timeUnits[i], i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2 + numSize - 15);
      }
      enc.addFrame(ctx);
      enc.finish();
    }
  }
};
