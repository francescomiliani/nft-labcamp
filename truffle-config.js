require('dotenv').config();
const constants = require('./scripts/constants');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const { getInfuraClientUrl } = require('./utils/helpers.js');

const MNEMONIC = process.env.MNEMONIC;

module.exports = {
    /**
     * Networks define how you connect to your ethereum client and let you set the
     * defaults web3 uses to send transactions. If you don't specify one truffle
     * will spin up a development blockchain for you on port 9545 when you
     * run `develop` or `test`. You can ask a truffle command to use a specific
     * network from the command line, e.g
     *
     * $ truffle test --network <network-name>
     */

    networks: {
        development: {
            host: '127.0.0.1', // Localhost (default: none)
            port: 7545, // Standard Ethereum port (default: none)
            network_id: '*' // Any network (default: none)
        },
        goerli: {
            provider: () => new HDWalletProvider(MNEMONIC, getInfuraClientUrl(constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_TESTNET_GOERLI) ),
            network_id: 5 // Goerli's id
        },
        polygon: {
            provider: () => new HDWalletProvider(MNEMONIC, getInfuraClientUrl(constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_MAINNET)),
            network_id: 137
        },
        mumbai: {
            provider: () => new HDWalletProvider(MNEMONIC, getInfuraClientUrl(constants.ConstantsObject.CHAIN_NAME_PARAMETER_POLYGON_TESTNET)),
            network_id: 80001
        },
        // Live on the public network.
        mainnet: { //Ethereum
            provider: () => new HDWalletProvider(MNEMONIC, getInfuraClientUrl(constants.ConstantsObject.CHAIN_NAME_PARAMETER_ETHEREUM_MAINNET)),
            network_id: 1 // Ethereum's Network id
        }
    },

    // Set default mocha options here, use special reporters etc.
    mocha: {
        // timeout: 100000
    },

    // Configure your compilers
    compilers: {
        solc: {
            version: '0.8.10' // Fetch exact version from solc-bin (default: truffle's version)
        }
    }
};
