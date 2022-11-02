const fs = require('fs');
const path = require('path');
const constants = require('../scripts/constants');
const { getAllFileNames } = require('./helpers.js');

const IMAGES_FOLDER_NAME = constants.ConstantsObject.IMAGES_FOLDER_NAME;
const IMAGES_FOLDER_PATH = path.resolve(__dirname, '..', IMAGES_FOLDER_NAME);

// renames the images in a given folder to hexadecimal sequence eg: 1,2,3,4,5,6,7,8,9,a,b etc

function main() {

    let fileNames = getAllFileNames(IMAGES_FOLDER_PATH);
    console.log('No. of files => ', fileNames.length);
    console.log('Filenames: ', fileNames);
    let counter = 1;
    // get filenames without extension
    fileNames = fileNames.map((fileName) => path.parse(fileName).name);

    // In first pass we prepend filenames with hexString separated by comma
    // we do this to avoid overriding filenames already in hexadecimal format
    fileNames.map((fileName) => {
        try {
            const hexString = parseInt(counter, 10).toString(16);
            fs.renameSync(
                `${IMAGES_FOLDER_PATH}/${fileName}.png`,
                `${IMAGES_FOLDER_PATH}/${hexString}_${fileName}.png`
            );
            counter++;
        } catch (err) {
            console.log(
                'error ocurred while adding hexString to the beginning of filenames: ',
                fileName
            );
            throw err;
        }
    });
    counter = 1;
    // in second pass we actually rename files to hexString
    fileNames.map((fileName) => {
        try {
            const hexString = parseInt(counter, 10).toString(16);
            fs.renameSync(
                `${IMAGES_FOLDER_PATH}/${hexString}_${fileName}.png`,
                `${IMAGES_FOLDER_PATH}/${hexString}.png`
            );
            console.log(
                `rename successful for file: ${fileName}.png to ${hexString}.png`
            );
            counter++;
        } catch (err) {
            console.log('error ocurred while renaming file: ', fileName);
            throw err;
        }
    });
    console.log('All files renamed successfully in images directory');
}
//==================================================================================
main();
