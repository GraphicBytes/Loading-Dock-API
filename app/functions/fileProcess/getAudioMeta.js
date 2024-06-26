//#######################################################
//############### GET AUDIO META FUNCTION ###############
//#######################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import ffmpeg from 'fluent-ffmpeg';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getAudioMeta(filePath) {

  ffmpeg.setFfprobePath('/usr/bin/ffprobe');
  
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) {
        reject(error);
        return;
      }

      const stream = metadata.streams.find(s => s.codec_type === 'audio');

      if (stream) {
        resolve({ metadata });
      } else {
        reject(new Error('Audio stream not found.'));
      }
    });
  });
}