const fs = require('fs');
const path = require('path');
const axios = require('axios');
const constants = require('../scripts/constants');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MAX_RETRIES = process.env.MAX_RETRIES;
const SMART_CONTRACT_ADDRESS_FILE_NAME = constants.ConstantsObject.SMART_CONTRACT_ADDRESS_FILE_NAME;
const SMART_CONTRACT_ADDRESS_FILE_PATH = path.join( path.resolve(__dirname, '..'), SMART_CONTRACT_ADDRESS_FILE_NAME);

const CHAIN = process.argv.slice(2)[0];
if (CHAIN !== constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_MAINNET 
    && CHAIN !== constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_TESTNET_GOERLI 
    && CHAIN !== constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_MAINNET
    && CHAIN !== constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_TESTNET ) {
  console.error( `Chain not supported.\n`);
  console.error(`Chain available are: 
  \t${constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_MAINNET}
  \t${constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_TESTNET_GOERLI}
  \t${constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_MAINNET}
  \t${constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_TESTNET}
  `);
  console.log(`USAGE: node deploy_verify.js {mainnet|goerli|polygon|mumbai}`);
  process.exit(-1);
}

let ENDPOINT_API="";
if(CHAIN === constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_MAINNET || CHAIN === constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_MAINNET)
    ENDPOINT_API = "https://api.opensea.io";
else 
    ENDPOINT_API = "https://testnets-api.opensea.io";

let maxRetries = MAX_RETRIES;
async function handleError( err ) {
    //console.error(err);
    if( err == "TOKEN_URI_NULL")
        console.error(`${err}: field token_uri of response is null. You have to wait...`);
    else 
        console.log(`\tCode: ${err.code}\n\tStatus: ${err.response.status}\n\tData: ${JSON.stringify(err.response.data, null, 4)}`);
    const waitTime = 3000;
    console.log(`... let's waiting for ${waitTime/1000} seconds due to an error`);
    maxRetries--;
    console.log(`maxRetries: ${maxRetries}`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
}

// Declare and lanch the async function
(async () => {
    console.log('Blockchain: ', process.argv.slice(2)[0]);
    console.log('ENDPOINT_API: ', ENDPOINT_API);
    console.log('MAX_RETRIES: ', MAX_RETRIES);
    console.log('   > \tREMEMBER: you can change MAX_RETRIES property in .env file\n\n');

    // Read SMART_CONTRACT_ADDRESS from file
    let SMART_CONTRACT_ADDRESS;
    try {
        SMART_CONTRACT_ADDRESS = fs.readFileSync(SMART_CONTRACT_ADDRESS_FILE_PATH, 'utf8').trim();
        console.log(`SMART_CONTRACT_ADDRESS from file: ${SMART_CONTRACT_ADDRESS}`);
    } catch (error) {
        console.log( `Error during smart contract address retrieval from file: ${error.message}` );
        process.exit(-1);
    }
    
    const URLs = {
        "validate": `${ENDPOINT_API}/api/v1/asset/${CHAIN}/${SMART_CONTRACT_ADDRESS}/1/validate`,
        "asset": `${ENDPOINT_API}/api/v1/asset/${CHAIN}/${SMART_CONTRACT_ADDRESS}/1`
    }
    console.log('\nValidate API is starting...!');
    let url = `${ENDPOINT_API}/api/v1/asset/${CHAIN}/${SMART_CONTRACT_ADDRESS}/1/validate`;
    console.log(`url: ${url}`);
    maxRetries = MAX_RETRIES;
    let resp;
    do {
        try {
            resp = await axios.get(url);
            console.log(JSON.stringify(resp.data, null, 4));
            if(resp.data.token_uri == null) {
                throw "TOKEN_URI_NULL";    // throw a text
            }
            break;
        } catch (err) {
            await handleError(err);
        }
    } while(maxRetries > 0);

    if( maxRetries == 0 ) {
        console.log('\nValidate API failed. Retry later...');
    } else { 
        console.log('\nValidate API performed successfully!');
    }
    console.log('\n==========================================================================================\n');

    if( CHAIN === constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_TESTNET_GOERLI 
        || CHAIN === constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_MAINNET ) {
        console.log('Asset retrieval API is starting...!');
        url = `${ENDPOINT_API}/api/v1/asset/${SMART_CONTRACT_ADDRESS}/1`;
        console.log(`url: ${url}`);
        maxRetries = MAX_RETRIES;
        resp = null;
        do {
            try {
                resp = await axios.get(url);
                console.log(JSON.stringify(resp.data, null, 4));
                break;
            } catch (err) {
                await handleError(err);
            }
        } while(maxRetries > 0);
    } else {
        console.log('Asset retrieval API NOT available for mumbai or polygon. SKIP this verification.');
    }

    if( maxRetries == 0 ) {
        console.log('\nDeploy verification failed. Retry later...');
    } else {
        console.log('\nAsset data retrieved successfully!');
        console.log('\nDeploy verification performed successfully!');
    }

    process.exit(0);
}) ();