//#######################################################
//############### GET VIDEO META FUNCTION ###############
//#######################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import ffmpeg from 'fluent-ffmpeg';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getVideoMeta(filePath) {

  ffmpeg.setFfprobePath('/usr/bin/ffprobe');
  
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) {
        reject(error);
        return;
      }

      const stream = metadata.streams.find(s => s.codec_type === 'video');
      if (stream) {
        resolve({ stream });
      } else {
        reject(new Error('Video stream not found.'));
      }
    });
  });
}
