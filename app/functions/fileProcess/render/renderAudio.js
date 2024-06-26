//#####################################################
//############### RENDER AUDIO FUNCTION ###############
//#####################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import { execa } from 'execa';
import pathToFfmpeg from 'ffmpeg-static';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function renderAudio(
  targetInputFile,
  targetOutputFile,
  targetBitrate
) {
  try {

    var inputFile = targetInputFile;
    var outputFile = targetOutputFile; 
    var bitrate = targetBitrate + 'k';


    const ffmpegArgs = [
      '-i', inputFile,                 // Input file 
      '-codec:a', 'libmp3lame',
      '-preset', 'veryslow', 
      '-b:a', bitrate,
      '-threads', '1',                 // Use only 1 CPU thread
      outputFile                     // Output file
    ];


    if (process.env.NODE_ENV === "development") {
      console.log('Rendering started');
    }

    await execa(pathToFfmpeg, ffmpegArgs);

    if (process.env.NODE_ENV === "development") {
      console.log('Rendering complete');
    }

  } catch (error) {
    console.error('Error rendering video:', error);
  }
}