//#####################################################
//############### RENDER VIDEO FUNCTION ###############
//#####################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import { execa } from 'execa';
import pathToFfmpeg from 'ffmpeg-static';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function renderVideoWebm(
  targetInputFile,
  targetOutputFile,
  targetWidth,
  targetHeight,
  targetFrameRate,
  targetBitrate,
  targetAudioBitrate
) {
  try {

    var inputFile = targetInputFile;
    var outputFile = targetOutputFile; 
    var crop = `scale=w=${targetWidth}:h=${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:color=black`;
    var videoBitrate = targetBitrate + 'k';
    var audioBitrate  = Math.min(targetAudioBitrate, 256) + 'k'; 

    const ffmpegArgs = [
      '-i', inputFile,                 // Input file
      '-vf', crop,
      '-c:v', 'libvpx-vp9',          // Video codec (VP9)
      '-b:v', videoBitrate,            // Set video bitrate (e.g., '1000k')
      '-r', targetFrameRate,                 // Set frame rate (e.g., '30')
      '-c:a', 'libopus',               // Audio codec (Opus)
      '-b:a', audioBitrate,            // Set audio bitrate (e.g., '128k')
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