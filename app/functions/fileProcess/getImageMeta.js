//#######################################################
//############### GET IMAGE META FUNCTION ###############
//#######################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import fs from 'fs';
import sharp from 'sharp';
import ExifParser from 'exif-parser';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getImageMeta(filePath) {

  try {

    let imageMeta = {};

    const fullMeta = await sharp(filePath).metadata();
    const { format, width, height, channels, size, orientation } = await sharp(filePath).metadata();


    imageMeta.format = format;
    imageMeta.width = width;
    imageMeta.height = height;
    imageMeta.channels = channels;
    imageMeta.size = size;
    imageMeta.orientation = orientation;
    imageMeta.fullMeta = fullMeta;
    //imageMeta.exif = "n/a";

    imageMeta.exif = await getImageExifData(filePath);



    return imageMeta;

  } catch (error) {
    console.error('Error reading image metadata:', error);
    return null;
  }

}


async function getImageExifData(imagePath) {
  return new Promise((resolve) => {

    const supportedFormats = ['jpg', 'jpeg', 'tif', 'tiff']; // Add more formats if needed
    const format = imagePath.split('.').pop().toLowerCase();

    if (!supportedFormats.includes(format)) {
      resolve("n/a");
    } else {

      fs.readFile(imagePath, (err, data) => {
        const parser = ExifParser.create(data);
        const result = parser.parse();
        resolve(result);
      });

    }

  });
}