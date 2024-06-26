//#######################################################
//############### MAKE WAVE FILE FUNCTION ###############
//#######################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
const fs = require('fs');
const { WaveFile } = require('wavefile');
const PNG = require('pngjs').PNG;
const sharp = require('sharp');

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
async function createWaveImage(wavePath, imagePath, waveFileWebpPath, backgroundColour, waveColour) {

  return new Promise((resolve) => {

    const wave = new WaveFile(fs.readFileSync(wavePath));
    const samples = wave.getSamples(true); // Get interleaved samples

    const canvasWidth = 20000;
    const canvasHeight = 2000;
    const waveformColor = waveColour; // RGB values for grey color
    const backgroundColor = backgroundColour; // RGB values for white color

    const png = new PNG({ width: canvasWidth, height: canvasHeight });

    const chunkSize = Math.ceil(samples.length / canvasWidth);

    // Calculate max amplitude in a more efficient way to avoid stack overflow
    let maxAmplitude = 0;
    for (let i = 0; i < samples.length; i++) {
      if (Math.abs(samples[i]) > maxAmplitude) {
        maxAmplitude = Math.abs(samples[i]);
      }
    }

    for (let i = 0; i < canvasWidth; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, samples.length);
      const segment = samples.slice(start, end);

      let segmentMaxAmplitude = 0;
      for (let j = 0; j < segment.length; j++) {
        if (Math.abs(segment[j]) > segmentMaxAmplitude) {
          segmentMaxAmplitude = Math.abs(segment[j]);
        }
      }

      const scaledAmplitude = Math.floor((segmentMaxAmplitude / maxAmplitude) * (canvasHeight / 2));

      for (let y = 0; y < canvasHeight; y++) {
        const index = (canvasWidth * y + i) << 2;
        const color = y >= Math.floor(canvasHeight / 2) - scaledAmplitude && y <= Math.floor(canvasHeight / 2) + scaledAmplitude
          ? waveformColor
          : backgroundColor;

        png.data[index] = color[0]; // Red
        png.data[index + 1] = color[1]; // Green
        png.data[index + 2] = color[2]; // Blue
        png.data[index + 3] = color[3]; // Alpha (opaque)
      }
    }

    const stream = fs.createWriteStream(imagePath);
    png.pack().pipe(stream);


    stream.on('finish', () => {

      // convert to WebP and resize
      sharp(imagePath)
        .resize(2500, 250)
        .webp({ quality: 70 })
        .toFile(waveFileWebpPath)
        .then(() => {

          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
              resolve(false);
            }
          });
        })
        .catch(err => {
          console.error('Error converting to WebP and resizing:', err);
          resolve(false);
        });

      if (process.env.NODE_ENV === "development") {
        console.log('Waveform image created successfully!');
      }
      
      resolve(true);

    });
  });
}

module.exports = {
  createWaveImage
};



























// const fs = require('fs');
// const { WaveFile } = require('wavefile');
// const PNG = require('pngjs').PNG;

// function createWaveImage(wavePath, imagePath) {
//   const wave = new WaveFile(fs.readFileSync(wavePath));
//   const samples = wave.getSamples(true); // Get interleaved samples

//   const canvasWidth = 800;
//   const canvasHeight = 200;
//   const waveformColor = [128, 128, 128]; // RGB values for grey color
//   const backgroundColor = [255, 255, 255]; // RGB values for white color

//   const png = new PNG({ width: canvasWidth, height: canvasHeight });

//   const chunkSize = Math.ceil(samples.length / canvasWidth);

//   for (let i = 0; i < canvasWidth; i++) {
//     const start = i * chunkSize;
//     const end = Math.min(start + chunkSize, samples.length);
//     const segment = samples.slice(start, end);

//     const yMid = Math.floor(canvasHeight / 2);
//     const amplitude = Math.max(...segment.map(Math.abs));
//     const scale = Math.floor((canvasHeight / 2) / amplitude);

//     for (let y = 0; y < canvasHeight; y++) {
//       const index = (canvasWidth * y + i) << 2;
//       const color = y >= yMid - Math.floor(amplitude * scale) && y <= yMid + Math.floor(amplitude * scale)
//         ? waveformColor
//         : backgroundColor;

//       png.data[index] = color[0]; // Red
//       png.data[index + 1] = color[1]; // Green
//       png.data[index + 2] = color[2]; // Blue
//       png.data[index + 3] = 255; // Alpha (opaque)
//     }
//   }

//   const stream = fs.createWriteStream(imagePath);
//   png.pack().pipe(stream);

//   stream.on('finish', () => {
//     console.log('Waveform image created successfully!');
//   });
// }

// module.exports = {
//   createWaveImage
// };