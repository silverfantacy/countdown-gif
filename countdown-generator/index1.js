'use strict';

const fs = require('fs');
const path = require('path');
const GIFEncoder = require('gifencoder');
const { Canvas } = require('canvas');
const moment = require('moment');

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
    // Set some sensible upper / lower bounds
    this.width = this.clamp(width, 150, 645);
    this.height = this.clamp(height, 120, 500);
    this.frames = this.clamp(frames, 1, 90);

    // this.bg = '#' + bg;
    // this.textColor = '#' + color;
    this.name = name;

    this.encoder = new GIFEncoder(this.width, this.height);
    this.canvas = new Canvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');

    // calculate the time difference (if any)
    let timeResult = this.time(time);

    // start the gif encoder
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

    // create the tmp directory if it doesn't exist
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }

    let filePath = tmpDir + this.name + '.gif';

    // pipe the image to the filesystem to be written
    let imageStream = enc
      .createReadStream()
      .pipe(fs.createWriteStream(filePath));
    // once finised, generate or serve
    imageStream.on('finish', () => {
      // only execute callback if it is a function
      typeof cb === 'function' && cb();
    });

    // estimate the font size based on the provided width
    let fontSize = Math.floor(this.width / 12) + 'px';
    let fontFamily = 'Courier New'; // monospace works slightly better

    // set the font style
    ctx.font = [fontSize, fontFamily].join(' ');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // start encoding gif with following settings
    enc.start();
    enc.setRepeat(0);
    enc.setDelay(1000);
    enc.setQuality(10);

    // 設定矩形寬高
    var rectWidth = (this.width - 10 * 3) / 4;
    var rectHeight = this.height;

    // 設定數字和文字大小
    var numSize = 16 * 3;
    var textSize = 14;

    // if we have a moment duration object
    if (typeof timeResult === 'object') {
      for (let i = 0; i < this.frames; i++) {
        // extract the information we need from the duration
        let days = Math.floor(timeResult.asDays());
        let hours = Math.floor(timeResult.asHours() - (days * 24));
        let minutes = Math.floor(timeResult.asMinutes()) - (days * 24 * 60) - (hours * 60);
        let seconds = Math.floor(timeResult.asSeconds()) - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);

        // make sure we have at least 2 characters in the string
        days = (days.toString().length == 1) ? '0' + days : days;
        hours = (hours.toString().length == 1) ? '0' + hours : hours;
        minutes = (minutes.toString().length == 1) ? '0' + minutes : minutes;
        seconds = (seconds.toString().length == 1) ? '0' + seconds : seconds;

        for (let i = 0; i < 4; i++) {
          // 設定填充顏色
          ctx.fillStyle = "#008df2";
          ctx.fillRect(i * (rectWidth + 10), 0, rectWidth, rectHeight);

          //設定文字顏色
          ctx.fillStyle = "#1e54a3";

          //設定文字置中
          ctx.textAlign = "center";
          // 繪製數字
          ctx.font = numSize + "px Arial";
          if (i === 0) {
            ctx.fillText(days, i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2);
          } else if (i === 1) {
            ctx.fillText(hours, i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2);
          } else if (i === 2) {
            ctx.fillText(minutes, i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2);
          } else if (i === 3) {
            ctx.fillText(seconds, i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2);
          }

          // 繪製文字
          ctx.font = textSize + "px Arial";
          if (i === 0) {
            ctx.fillText("天", i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2 + numSize + 10);
          } else if (i === 1) {
            ctx.fillText("時", i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2 + numSize + 10);
          } else if (i === 2) {
            ctx.fillText("分", i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2 + numSize + 10);
          } else if (i === 3) {
            ctx.fillText("秒", i * (rectWidth + 10) + rectWidth / 2, rectHeight / 2 + numSize + 10);
          }
        }

        // add finalised frame to the gif
        enc.addFrame(ctx);

        // remove a second for the next loop
        timeResult.subtract(1, 'seconds');
      }
    } else {
      // Date has passed so only using a string

      // BG
      ctx.fillStyle = this.bg;
      ctx.fillRect(0, 0, this.width, this.height);

      // Text
      ctx.fillStyle = this.textColor;
      ctx.fillText(timeResult, this.halfWidth, this.halfHeight);
      enc.addFrame(ctx);
    }

    // finish the gif
    enc.finish();
  }
};
