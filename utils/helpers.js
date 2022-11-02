const fs = require('fs');
const path = require('path');
const constants = require('../scripts/constants');

function getTokenIds(startTokenId, size) {
    return Array(size)
        .fill()
        .map((element, index) => index + startTokenId);
}

function getAmounts(size) {
    return Array(size).fill(1);
}

function getAllFileNames(dir) {
    let fileNames = [];
    try {
        fileNames = fs
            .readdirSync(dir, { withFileTypes: true })
            .filter((item) => !item.isDirectory())
            .map((item) => item.name);
    } catch (err) {
        console.log(
            `error occurred while getting all filenames from directory ${dir}: `,
            err
        );
        throw err;
    }
    return fileNames;
}

function retrieveIPFSLocation( folder ) {
  const IMAGES_FOLDER_NAME = constants.ConstantsObject.IMAGES_FOLDER_NAME;
  const IMAGES_IPFS_LOCATION_FILE_NAME = constants.ConstantsObject.IMAGES_IPFS_LOCATION_FILE_NAME;
  const METADATA_IPFS_LOCATION_FILE_NAME = constants.ConstantsObject.METADATA_IPFS_LOCATION_FILE_NAME;

  const IPFS_FILE_NAME = (folder == IMAGES_FOLDER_NAME ) ? IMAGES_IPFS_LOCATION_FILE_NAME : METADATA_IPFS_LOCATION_FILE_NAME;
  const IPFS_FILE_PATH = path.resolve(__dirname, '..',IPFS_FILE_NAME);
  try {
    const location = fs.readFileSync( IPFS_FILE_PATH, 'utf8');
    console.log(`IPFS location retrieved: ${location}`);
    return location;
  } catch (error) {
    console.log(`error: ${error}`);
    return -1;
  }
}

function getNFTIDsList() {
  const TOKEN_IDS_FILE_NAME = constants.ConstantsObject.TOKEN_IDS_FILE_NAME;
  const TOKEN_IDS_FILE = path.join( path.resolve( __dirname, ".."), TOKEN_IDS_FILE_NAME);
  try {
    const tokensString = fs.readFileSync(TOKEN_IDS_FILE,'utf8');
    console.log(`tokens ids retrieved ${tokensString}`);
    return tokensString.split(",");
  } catch (error) {
    console.log(`error: ${error}`);
    return -1;
  }
}

function getNFTAmount() {
    try {
      let amount = getNFTIDsList().length;
      console.log(`Amount tokens ids: ${amount}`);
      return amount;
    } catch (error) {
      console.log(`error: ${error}`);
      return -1;
    }
}

function getInfuraClientUrl( environment ) {
  const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
  const GOERLI_CLIENT_URL = process.env.GOERLI_CLIENT_URL + INFURA_PROJECT_ID;
  const ETHEREUM_CLIENT_URL = process.env.ETHEREUM_CLIENT_URL + INFURA_PROJECT_ID;
  const POLYGON_MAINNET_CLIENT_URL = process.env.POLYGON_MAINNET_CLIENT_URL + INFURA_PROJECT_ID;
  const POLYGON_TESTNET_CLIENT_URL = process.env.POLYGON_TESTNET_CLIENT_URL + INFURA_PROJECT_ID;

  switch( environment ) {
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_MAINNET: 
      return ETHEREUM_CLIENT_URL;
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_TESTNET_GOERLI: 
      return GOERLI_CLIENT_URL;
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_MAINNET: 
      return POLYGON_MAINNET_CLIENT_URL;
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_TESTNET: 
      return POLYGON_TESTNET_CLIENT_URL;
    default:
      return -1;
  }
}

function getChainID( chain ) {
  switch( chain ) {
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_MAINNET: 
      return 1;
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_TESTNET_GOERLI: 
      return 5;
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_MAINNET: 
      return 137;
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_TESTNET: 
      return 80001;
    default:
      return -1;
  }
}

function getTokenFromNetwork(network) {
  switch( network ) {
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_MAINNET:
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_TESTNET_GOERLI: 
      return 'ETH';
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_MAINNET: 
    case constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_TESTNET: 
      return 'MATIC';
    default:
      return -1;
  }
}


module.exports = {
    getTokenIds,
    getAmounts,
    getAllFileNames,
    retrieveIPFSLocation,
    getNFTIDsList,
    getNFTAmount,
    getInfuraClientUrl,
    getChainID,
    getTokenFromNetwork
};
