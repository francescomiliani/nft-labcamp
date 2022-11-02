const fs = require("fs");
const path = require("path");
const constants = require('../scripts/constants');
const { getInfuraClientUrl, getChainID } = require('../utils/helpers.js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const {OpenSeaSDK, Network} = require("opensea-js");
const { WyvernSchemaName } = require('opensea-js/lib/types')
const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");

const MNEMONIC = process.env.MNEMONIC;
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const OWNER_ADDRESS = process.env.OWNER_ADDRESS;
const OPENSEA_API_KEY = (process.env.OPENSEA_API_KEY != "INSERT_HERE_YOUR_OPENSEA_API_KEY" && process.env.OPENSEA_API_KEY != "") ? OPENSEA_API_KEY : "";

const TOKEN_IDS_FILE_NAME = constants.ConstantsObject.TOKEN_IDS_FILE_NAME;
const TOKEN_IDS_DIRECTORY_PATH = path.join( path.resolve(__dirname, '..'), TOKEN_IDS_FILE_NAME);
const SMART_CONTRACT_ADDRESS_FILE_NAME = constants.ConstantsObject.SMART_CONTRACT_ADDRESS_FILE_NAME;
const SMART_CONTRACT_ADDRESS_FILE_PATH = path.join( path.resolve(__dirname, '..'), SMART_CONTRACT_ADDRESS_FILE_NAME);
const CONFIG_FILE_NAME = constants.ConstantsObject.CONFIG_FILE_NAME;
const CONFIG_FILE_PATH = path.join( path.resolve(__dirname, '..'), CONFIG_FILE_NAME);

if (!MNEMONIC || !INFURA_PROJECT_ID || !OWNER_ADDRESS) {
  console.error("Please set a mnemonic, Alchemy/Infura key, owner address, CHAIN, API key, NFT contract, and contract address.");
  return -1;
}

const CHAIN = process.argv.slice(2)[0];
if (CHAIN !== constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_MAINNET && CHAIN !== constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_TESTNET_GOERLI) {
  console.error( `Chain not supported.\nChain available are: ${constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_MAINNET} or ${constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_TESTNET_GOERLI}` );
  console.log(`USAGE: node getPaymentTokens.js goerli`);
  return -1;
}

let OPENSEA_NETWORK;
if( CHAIN === constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_MAINNET )
  OPENSEA_NETWORK = Network.Main;
else if( CHAIN === constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_TESTNET_GOERLI )
  OPENSEA_NETWORK = Network.Goerli;
else {
  console.error( `Chain not supported in OpenSea.` );
  return -1;
}

console.log(`Chain: ${CHAIN}`);
console.log(`OPENSEA_NETWORK: ${OPENSEA_NETWORK}`);
console.log(`Chain ID: ${getChainID(CHAIN)}`);
console.log(`INFURA_PROJECT_ID: ${INFURA_PROJECT_ID}`);
console.log(`Infura client url: ${getInfuraClientUrl(CHAIN)}`);
console.log(`OWNER_ADDRESS: ${OWNER_ADDRESS}`);
console.log(`OPENSEA_API_KEY: ${OPENSEA_API_KEY}`);

let provider = new HDWalletProvider({
  mnemonic: {
    phrase: MNEMONIC
  },
  chainId: getChainID(CHAIN),
  providerOrUrl: getInfuraClientUrl(CHAIN)
});
const web3 = new Web3(provider);

const openseaSDK = new OpenSeaSDK(
  provider, 
  {
    networkName: OPENSEA_NETWORK,
    apiKey: OPENSEA_API_KEY
  },
  (arg) => console.log(arg)
);

(async () => {


  // Read all token ids from file
  let idString, NFT_CONTRACT_ADDRESS, config, paymentTokenAddress, balance = 0;
  try {
    balance = await web3.eth.getBalance( OWNER_ADDRESS );
    balance = web3.utils.fromWei( balance.toString(), 'ether');
    console.log(`Account Balance before listing: ${balance} ETH`);

    idString = fs.readFileSync(TOKEN_IDS_DIRECTORY_PATH, 'utf8');
    console.log(`IDs to list: ${idString}`);
    
    NFT_CONTRACT_ADDRESS = fs.readFileSync(SMART_CONTRACT_ADDRESS_FILE_PATH, 'utf8').trim();
    console.log(`NFT_CONTRACT_ADDRESS from file: ${NFT_CONTRACT_ADDRESS}`);
    
    config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
    console.log(`collection descriptor: ${JSON.stringify(config, null, 4)}`);
  } catch (error) {
    console.log( error );
    return -1;
  }

  // Get Payment Token Address
  try {
    paymentTokenAddress = (await openseaSDK.api.getPaymentTokens({ symbol: config.paymentToken })).tokens[0].address;
    console.log(`This is ${config.paymentToken} token address: ${JSON.stringify(paymentTokenAddress)}\n`);
    // MATIC does not exist
  } catch (error) {
      console.error( error );
      paymentTokenAddress = "0x0000000000000000000000000000000000000000"; // ETH
      console.log( `Set paymentTokenAddress to default value = ${paymentTokenAddress}`);
  }

  const tokenIdArray = idString.split(",");
  const assets = [];
  const errors = [];

  for(let i = 0; i < tokenIdArray.length; i++) {
    assets.push( { tokenId: tokenIdArray[i], tokenAddress: NFT_CONTRACT_ADDRESS, schemaName: WyvernSchemaName.ERC1155 });
    //console.log( `Added asset to assets array:\n`, JSON.stringify(assets[i], null, 4) );
      
    try {
      // Example: simple fixed-price sale of an item owned by a user.
      console.log("Auctioning an item for a fixed price...");

      // Compute expiration date
      // https://docs.opensea.io/changelog/limits-on-order-expiration-time
      // We’ll require an order expiration time to be explicitly defined, 
      // within a minimum of 15 minutes and a maximum of 6 months.
      let myCurrentDate=new Date();
      let myFutureDate=new Date(myCurrentDate);
      myFutureDate.setDate(myFutureDate.getDate()+ (6 * 30));//myFutureDate is now 6 months in the future
      const _expirationTime = Math.floor(myFutureDate.getTime()/1000);

      console.log("   > Order expirationTime: " + myFutureDate );
      const order = {
        asset: {
          tokenId: tokenIdArray[i],
          tokenAddress: NFT_CONTRACT_ADDRESS,
          schemaName: WyvernSchemaName.ERC1155
        },
        startAmount: parseFloat(config.listingPrice),
        expirationTime: _expirationTime, 
        accountAddress: OWNER_ADDRESS,
        quantity: 1,
        paymentTokenAddress: paymentTokenAddress
      };
      console.log(`Let's submit the following order:\n${JSON.stringify(order, null, 4)}`);

      const fixedPriceSellOrder = await openseaSDK.createSellOrder( order );
      console.log("   > Successfully created a fixed-price sell order!");
      console.log(`   > OpenSea link: ${fixedPriceSellOrder.makerAssetBundle.assets[0].openseaLink}`);
      
      //console.log(`\nResult:\n${JSON.stringify(fixedPriceSellOrder, null, 4)}`);

      // https://docs.opensea.io/reference/api-overview
      // https://docs.opensea.io/reference/testnets-api-overview
      // What is the default rate limit?: GET requests are limited to 4/sec. POST requests are limited to 2/sec.
      console.log(`... let's waiting for 0.6 seconds due to API rate limit`);
      await new Promise(resolve => setTimeout(resolve, 600));
      console.log('==========================================================================================\n');
    } catch (error) {
      console.log( error );

      if( error.toString().indexOf("API Error 429") > -1) {
        const waitTime = /\d+/.exec(error.message.split('Expected')[1]) * 1000;
        console.log(`... let's waiting for ${waitTime/1000} seconds due to API 429 error`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        //Set index minus 1 to back one position
        i--;
      } else {
        console.log( 'Error different from API Error 429: Message: {"detail":"Request was throttled. Expected available in N seconds."}.' );
        console.log( `This error will be saved in ${constants.ConstantsObject.LISTING_ERROR_FILE} file`);
        errors.push( `Error occured during tokenID ${tokenIdArray[i]}: ${error}` );
      }
    }
  }// for
  let afterListingBalance = await web3.eth.getBalance( OWNER_ADDRESS );
  afterListingBalance = web3.utils.fromWei(afterListingBalance.toString(), 'ether');
  console.log(`\nAccount Balance after listing: ${afterListingBalance} ETH`);
  console.log(`Total amount spent for listing: ${balance - afterListingBalance} ETH\n`);

 if( errors.length == 0) {
  console.log(`All NFTs have been listed successfully!`);
  process.exit(0);
 } else {
  console.log('ATTENTION!');
  console.log(`Occured # ${errors.length} errors`);
  try {
    let errorString = "";
    for( let e in errors )
      errorString += errors[e] + '\n';

    fs.writeFileSync( constants.ConstantsObject.LISTING_ERROR_FILE, errorString,'utf8');
    console.log(`File ${constants.ConstantsObject.LISTING_ERROR_FILE} written successfully!`);
    process.exit(0);

  } catch (error) {
    console.log( error );
    process.exit(-1);
  }
 }

}) ();// end main