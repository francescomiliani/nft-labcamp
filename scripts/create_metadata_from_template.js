const fs = require('fs');
const path = require('path');
const constants = require('./constants');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getAllFileNames, retrieveIPFSLocation } = require('../utils/helpers.js');

const NAME_REPLACE_STRING = /_NAME_/g;
const DESCRIPTION_REPLACE_STRING = /_DESCRIPTION_/g;
const IMAGE_REPLACE_STRING = /_IMAGE_/g;
const IMAGES_FOLDER_NAME = constants.ConstantsObject.IMAGES_FOLDER_NAME;
const METADATA_FOLDER_NAME = constants.ConstantsObject.METADATA_FOLDER_NAME;
const TOKEN_IDS_FILE_NAME = constants.ConstantsObject.TOKEN_IDS_FILE_NAME;
const METADATA_TEMPLATE_FILE_NAME = constants.ConstantsObject.METADATA_TEMPLATE_FILE_NAME;
const METADATA_DIRECTORY_PATH = path.resolve(__dirname, '..', METADATA_FOLDER_NAME);
const TOKEN_IDS_FILE_PATH = path.resolve(__dirname, '..', TOKEN_IDS_FILE_NAME);
const METADATA_TEMPLATE_FILE_PATH = path.resolve(__dirname, '..', METADATA_TEMPLATE_FILE_NAME);

const useHexadecimalFormatForImagesDir = true;

function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
  }
}

function createTokenIDsFile( ids ) {
  //console.log(`createTokenIDsFile() ids: ${ids}\nids.length: ${ids.length}`);
  let string = "";
  for(let i=0; i<ids.length; i++ ) {
    if( i < ids.length-1)
      string = string.concat(ids[i],",");
    else
    string = string.concat(ids[i]);
  }
  console.log(`createTokenIDsFile() string to write: ${string}`);
  fs.writeFile( TOKEN_IDS_FILE_PATH, string, 'utf8', function (err) {
    if (err) return console.log(err);
    console.log(`${TOKEN_IDS_FILE_NAME} file created successfully!`);
  });
}

function createMetadataHexFileName(idx, fileName) {
  let hexString = null;
  if (useHexadecimalFormatForImagesDir) {
      hexString = fileName;
  } else {
      hexString = parseInt(idx + 1, 10).toString(16);
  }
  return hexString;
}

function toPaddedHexString(num, len) {
  return num.toString(16).padStart(len, '0');
}

function main() {
  console.log('Replacing of IPFS CID in metadata files');

  const IMAGES_IPFS_LOCATION = retrieveIPFSLocation( IMAGES_FOLDER_NAME );

  if (IMAGES_IPFS_LOCATION === "REPLACE_ME" ) {
    console.log('ERROR! Images IPFS CID is not set. Please set it before run the script');
    process.exit(-1);
  }

  let filesNumber = -1;
  const tokenIds = [];
  let fileNames = getAllFileNames( path.resolve(__dirname, '..', IMAGES_FOLDER_NAME) );
  const promisesArray = [];

  createDirIfNotExists( METADATA_DIRECTORY_PATH ) ;

  //listing all files using forEach
  fileNames.forEach(function (file) {
    promisesArray.push( new Promise((resolve, reject) => {
      filesNumber++;

      let data;
      try {
        data = fs.readFileSync( METADATA_TEMPLATE_FILE_PATH, {encoding:'utf8', flag:'r'});
      } catch( err ) {
        console.log(`Error occurred while updating metadata for file: ${file}.\n\t${err}`);
        reject();
      }

      console.log(`processing: ${file}`);
      let id = path.parse(file).name;

      let ipfsLocation = `ipfs://${IMAGES_IPFS_LOCATION}/${id}.png`;
      var metadata = data.replace(IMAGE_REPLACE_STRING, ipfsLocation);
      metadata = metadata.replace(DESCRIPTION_REPLACE_STRING, process.env.NFTS_DESCRIPTION + id);
      metadata = metadata.replace(NAME_REPLACE_STRING, `NFT ${id}` );
      for( d of constants.ConstantsObject.METADATA_TEMPLATE_FEATURES ) {
        metadata = metadata.replace(`${d}`, Math.abs((Math.floor(Math.random()*100))));
      }

      // Hex string is needed due to the interpretion of the string, in Hex
      // So, sequential ids will be: 1,...,9, a,b,c,d,e,f,10, ...
      const hexString = createMetadataHexFileName(filesNumber, id);
      console.log(`hexString: ${hexString}`);
      tokenIds.push( hexString );

      // Padding is needed to OpenSea to upload json files in its IPFS
      // Convert filename to padded hex string
      const paddedHexString = toPaddedHexString(hexString,64);
      console.log(`paddedHexString: ${paddedHexString}`);
      
      console.log(`NFT id: ${id} will be available at IPFS location: ${ipfsLocation}`);
      // Create metadata file
      fs.writeFile( `${METADATA_DIRECTORY_PATH}/${paddedHexString}.json`, metadata, 'utf8', function (err) {
        if (err) {
          console.log(`Error occurred while updating metadata for file: ${file}.\n\t${err}`);
          reject();
        }
        console.log('Metadata file created successfully for file: ', hexString);
        resolve();
      });
      })
    );// promisesArray push close
  });// end for each

  Promise.all(promisesArray)
    .then(() => {    
        console.log(`All ${filesNumber} files have been processed successfully!`);

        createTokenIDsFile( tokenIds );
      }
    )
    .catch((err) =>
        console.log('error occurred while updating metadata files: ', err)
    );

}

//====================================================================================
//====================================================================================

main();