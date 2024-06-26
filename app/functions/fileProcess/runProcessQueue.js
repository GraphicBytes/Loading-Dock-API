//######################################################
//############### RUN FILE PROCESS QUEUE ###############
//######################################################

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { tempFilesModel } from '../../models/tempFilesModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { processVideo } from './processVideo.js';
import { processAudio } from './processAudio.js';
import { processImage } from './processImage.js';
import { processDocument } from './processDocument.js';
import { processFile } from './processFile.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function runProcessQueue() {

  return new Promise((resolve) => {

    try {

      tempFilesModel.findOne({ file_lock: 0, virus_scanned: 1, process: 1, rendered: 0, error: 0 }, async function (err, obj) {

        if (obj) {

          let fileID = obj.file_id;
          let fileType = obj.file_type;

          if (fileType === "video") { processVideo(fileID) }
          else if (fileType === "audio") { processAudio(fileID) }
          else if (fileType === "image") { processImage(fileID) }
          else if (fileType === "document") { processDocument(fileID) }
          else if (fileType === "file") { processFile(fileID) }

          resolve(true);

        } else {
          resolve(false);
        }

      });



    } catch (error) {
      console.error('Error virus scanning:', error);

      resolve(false);

    }

  });
}

export default runProcessQueue;

