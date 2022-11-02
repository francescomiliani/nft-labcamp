const path = require("path");
const constants = require('../scripts/constants');
const { getInfuraClientUrl, getChainID } = require('../utils/helpers.js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const  {OpenSeaSDK, Network} = require("opensea-js");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const MNEMONIC = process.env.MNEMONIC;
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const OPENSEA_API_KEY = (process.env.OPENSEA_API_KEY != "INSERT_HERE_YOUR_OPENSEA_API_KEY" && process.env.OPENSEA_API_KEY != "") ? OPENSEA_API_KEY : "";

if (!MNEMONIC || !INFURA_PROJECT_ID) {
  console.error("Please set a mnemonic, Alchemy/Infura key, CHAIN, API key.");
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
console.log(`OPENSEA_API_KEY: ${OPENSEA_API_KEY}`);

let provider = new HDWalletProvider({
  mnemonic: {
    phrase: MNEMONIC
  },
  chainId: getChainID(CHAIN),
  providerOrUrl: getInfuraClientUrl(CHAIN)
});


const openseaSDK = new OpenSeaSDK(
  provider, 
  {
    networkName: OPENSEA_NETWORK,
    apiKey: OPENSEA_API_KEY
  },
  (arg) => console.log(arg)
);

(async () => {

    try {
      const paymentTokens = await openseaSDK.api.getPaymentTokens();
      console.log(JSON.stringify(paymentTokens, null, 4));
      // To extract single paymentToken information
      //const paymentTokenAddress = (await openseaSDK.api.getPaymentTokens({ symbol: 'ETH'})).tokens[0]
      //console.log(JSON.stringify(paymentTokenAddress, null, 4));
      //console.log(`This is MATIC token address: ${JSON.stringify(paymentTokenAddress)}`);
      // MATIC does not exist

      process.exit(0);
    } catch (error) {
      console.log( error );
      process.exit(-1);
    }

}) ();// end main
