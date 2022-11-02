const fs = require('fs');
const path = require('path');
const constants = require('./constants');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const data = require('../build/contracts/ArtCollectible.json');
const { getNFTIDsList, getAmounts, getInfuraClientUrl } = require('../utils/helpers.js');

const abiArray = data.abi;
const SMART_CONTRACT_ADDRESS_FILE_NAME = constants.ConstantsObject.SMART_CONTRACT_ADDRESS_FILE_NAME;
const SMART_CONTRACT_ADDRESS_FILE_PATH = path.resolve(__dirname, '..', SMART_CONTRACT_ADDRESS_FILE_NAME);
const MINT_SIZE = parseInt(process.env.MINT_SIZE);
const MNEMONIC = process.env.MNEMONIC;
const CLIENT_URL = getInfuraClientUrl( process.argv.slice(2)[0] );

if( CLIENT_URL == -1) {
    console.log('Passed wrong environment input parameter: ', process.argv.slice(2)[0] );
    console.log('Usage: node bulk_mint_nfts.js <network> <mint_size>');
    console.log('\tExample: node bulk_mint_nfts.js goerli 100');
    process.exit(-1);
}

if( MINT_SIZE < 1 ) {
    console.log('Passed wrong MINT_SIZE parameter: ', MINT_SIZE );
    console.log('Usage: node bulk_mint_nfts.js <network> <mint_size>');
    console.log('\tExample: node bulk_mint_nfts.js goerli 100');
    process.exit(-1);
}

const provider = new HDWalletProvider(MNEMONIC, CLIENT_URL);
const web3 = new Web3(provider);

// Declare and lanch the async function
(async () => {
    try {
        console.log('Blockchain: ', process.argv.slice(2)[0]);
        console.log('MINT_SIZE: ', MINT_SIZE);
        
        const accounts = await web3.eth.getAccounts();
        //console.log('Accounts:', accounts);
        console.log(`Account[0]: ${accounts[0]}`);

        const NFT_CONTRACT_ADDRESS = fs.readFileSync(SMART_CONTRACT_ADDRESS_FILE_PATH, 'utf8');
        console.log(`NFT_CONTRACT_ADDRESS from file: ${NFT_CONTRACT_ADDRESS}`);
        // passing third argument is necessary here since the functions with onlyOwner modifier can be only accessed by deployer of contract which is accounts[0] in our case
        const artCollectible = new web3.eth.Contract(
            abiArray,
            NFT_CONTRACT_ADDRESS,
            {
                from: accounts[0]
            }
        );

        // Get the array containing all NFT ids
        const ids = getNFTIDsList();
        // Total number of NFT's to be minted
        const totalNfts = ids.length;
        console.log('Total amount NTFs to mint: ', totalNfts);

        // NFT's to mint in each transaction
        const mintSize = MINT_SIZE;
        for (let i = 1, j = totalNfts; i <= j; i += mintSize) {
            if (mintSize === 0) {
                throw new Error(
                    'Please specify greater than zero value for mintSize'
                );
            }
            let currentMintSize = mintSize;
            if (i + mintSize <= totalNfts + 1) {
                currentMintSize = mintSize;
            } else {
                // case when totalNfts is not a multiple of mintSize
                currentMintSize = totalNfts - i + 1;
            }

            // array containing amount to mint for each tokenId, 1 in case of NFT's
            const amounts = getAmounts(currentMintSize);
            console.log('\t> Token Ids to be minted in current batch => ', ids);
            console.log('\t> Amounts to be minted for each Token Id in current batch => ',amounts);
            await artCollectible.methods
                .mintBatch(ids, amounts)
                .send({ from: accounts[0] });
            console.log(`\t> Successfully batch minted NFTs for current batch ${i}`);
            console.log('======================================================================');
        }// end for

        console.log('\nBatch NFTs minting completed successfully!');
        // https://docs.openzeppelin.com/contracts/2.x/api/token/erc721#IERC721-balanceOf-address-
        //console.log(`Returns number of NFT's in owner's account for tokenID 1`);
        //const balance = await artCollectible.methods.balanceOf(accounts[0], 1).call();
        //console.log(`Account[0]: ${accounts[0]} \nbalance: ${balance}`);

        process.exit(0);
    } catch (err) {
        console.log('Error occurred while calling deployed contract:', err);
        process.exit(-1);
    }
}) ();