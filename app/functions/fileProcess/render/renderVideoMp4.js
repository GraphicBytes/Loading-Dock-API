//#####################################################
//############### RENDER VIDEO FUNCTION ###############
//#####################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import { execa } from 'execa';
import pathToFfmpeg from 'ffmpeg-static';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { ensureEven } from '../../helpers/ensureEven.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function renderVideoMp4(
  targetInputFile,
  targetOutputFile,
  targetWidth,
  targetHeight,
  targetFrameRate,
  targetBitrate,
  targetAudioBitrate,
  cpuThreadsToUse
) {
  try {

    const doWidth = ensureEven(targetWidth);
    const doHeight = ensureEven(targetHeight);

    var inputFile = targetInputFile;
    var outputFile = targetOutputFile; 
    var crop = `scale=w=${doWidth}:h=${doHeight}:force_original_aspect_ratio=decrease,pad=${doWidth}:${doHeight}:(ow-iw)/2:(oh-ih)/2:color=black`;
    var videoBitrate = targetBitrate + 'k';
    var audioBitrate = targetAudioBitrate + 'k';


    const ffmpegArgs = [
      '-i', inputFile,                 // Input file
      '-vf', crop,
      '-c:v', 'h264',               // Video codec (x264)
      '-tune', 'film',             // Preset for the x264 codec (adjust as needed)
      '-b:v', videoBitrate,            // Set video bitrate (e.g., '1000k')
      '-r', targetFrameRate,                 // Set frame rate (e.g., '30')
      '-c:a', 'aac',                   // Audio codec (AAC)
      '-b:a', audioBitrate,            // Set audio bitrate (e.g., '128k')
      '-strict', '-2',                 // Enable experimental AAC codec
      '-threads', cpuThreadsToUse,                 // Use only 1 CPU thread
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