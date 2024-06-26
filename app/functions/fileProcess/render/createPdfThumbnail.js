//####################################################
//############### CREATE PDF THUMBNAIL ###############
//####################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import { exec } from 'child_process';
import util from 'util';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
const execPromise = util.promisify(exec);

export const createPdfThumbnail = async (pdfPath, thumbnailPath, imageSize) => {
  try {
    const command = `convert -thumbnail x${imageSize} -background white -alpha remove  -quality 100 "${pdfPath}[0]" ${thumbnailPath}`;
    await execPromise(command);   

  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
};