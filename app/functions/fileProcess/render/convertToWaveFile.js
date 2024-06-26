//###########################################################
//############### CONVERT TO WAVE FILE FORMAT ###############
//###########################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import ffmpeg from 'fluent-ffmpeg';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function convertToWaveFile(mp3Path, wavePath, cpuThreads = 1) {
 
  ffmpeg.setFfprobePath('/usr/bin/ffprobe');

  return new Promise((resolve, reject) => {
    const outputPath = `${wavePath}`;

    ffmpeg(mp3Path)
      .output(outputPath)
      .outputOptions(`-threads ${cpuThreads}`) // Fixed this line
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        //console.log(err);
        resolve(false);
      })
      .run();
  });
}
