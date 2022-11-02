const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getTokenFromNetwork } = require('../utils/helpers.js');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const axios = require('axios');
const data = require('../build/contracts/ArtCollectible.json');
const { getTokenIds, getNFTIDsList, getAmounts, getInfuraClientUrl } = require('../utils/helpers.js');

const abiArray = data.abi;
const MNEMONIC = process.env.MNEMONIC;
const NETWORK = process.argv.slice(2)[0];
const CLIENT_URL = getInfuraClientUrl( NETWORK );
if( CLIENT_URL ==-1 ) {
    console.error("Network passed is wrong.");
    console.error("USAGE: node estimate_fas_fees.js {mainnet|goerli|polygon|mumbai} [smart_contract_address] [--skipDeploy]");
    return -1;
}

const provider = new HDWalletProvider(MNEMONIC, CLIENT_URL);
const web3 = new Web3(provider); 

(async () => {
    try {
        let totalCost = 0, deploymentCost = null, mintBatchCost = null, tokenEurPrice=-1;
        let contractDeploymentEstimatedGas = null, mintBatchEstimatedGas = null;
        console.log('NETWORK:', NETWORK);
        const accounts = await web3.eth.getAccounts();
        console.log('Available accounts:', accounts);
        const SMART_CONTRACT_ADDRESS = process.argv.slice(2)[1] !== undefined  && process.argv.slice(2)[1] !== '--skipDeploy'? process.argv.slice(2)[1] : undefined;
        console.log('SMART_CONTRACT_ADDRESS:',SMART_CONTRACT_ADDRESS);
        const TOKEN = getTokenFromNetwork( NETWORK ); 
        const artCollectible = new web3.eth.Contract(
            abiArray,
            SMART_CONTRACT_ADDRESS,
            {
                from: accounts[0]
            }
        );
        console.log('======================================================================================');

        const block = await web3.eth.getBlock('latest');
        console.log('   > Block gasLimit:', block.gasLimit); 
        const currentGasPrice = await web3.eth.getGasPrice();
        console.log(`Current gas price: ${web3.utils.fromWei(currentGasPrice.toString(), 'ether')} ${TOKEN}`);
        let response;
        try {
            response = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${TOKEN}&tsyms=EUR`);
            tokenEurPrice = response.data.EUR;
            console.log( `\n${TOKEN}/EUR exchange: ${tokenEurPrice} €`);
        } catch(err) {
            console.log(err);
        }
        console.log('======================================================================================');
        if( (process.argv.slice(2).length == 1 && SMART_CONTRACT_ADDRESS == undefined)
            || (process.argv.slice(2).length == 2)
            || (process.argv.slice(2).length == 3 && process.argv.slice(2)[2] !== '--skipDeploy')) {

            if(process.argv.slice(2).length == 2 && process.argv.slice(2)[1] == '--skipDeploy') {
                console.log('   > --skipDeploy option ignore... You have to specifiy the smart contract address to use it.\n');
            }
            console.log('\nContract deployment gas estimation...\n');
            
            const bytecode = data.bytecode;
            let options = {
                arguments: [ ],
                data: bytecode
            }

            contractDeploymentEstimatedGas = await artCollectible.deploy(options).estimateGas();
            console.log(`Gas required for deploy the contract: ${contractDeploymentEstimatedGas}`);
            deploymentCost = contractDeploymentEstimatedGas * currentGasPrice;
            console.log(`Gas cost estimation = ${web3.utils.fromWei(deploymentCost.toString(), 'ether')} ${TOKEN}`);
            if(tokenEurPrice != -1)
                console.log( `\nDeploy expense in €: ${(Math.round(tokenEurPrice * web3.utils.fromWei((deploymentCost).toString(), 'ether') * 100)/100).toFixed(3)} €`);
        }
        if( SMART_CONTRACT_ADDRESS != undefined ) {
            console.log('======================================================================================');
            console.log('\nBulk minting gas estimation...\n');
            
            //const ids = getNFTIDsList();
            let ids = getTokenIds(1, 10000);
            let amounts = getAmounts( ids.length );
            console.log('NFTs Amounts => ', ids.length);
            //console.log('Token ids => ', ids);
            //console.log('Amounts => ', amounts);
            try {
                mintBatchEstimatedGas = await artCollectible.methods.mintBatch(ids, amounts).estimateGas();
            } catch(err) {
                console.log(err);
                console.log('  > You submitted a transaction with a required gas higher than the gas limit!');
                console.log("  > Let's try with 10 nfts");
                let sub_ids = getTokenIds(1, 10);
                amounts = getAmounts( sub_ids.length );
                mintBatchEstimatedGas = await artCollectible.methods.mintBatch(sub_ids, amounts).estimateGas();
                console.log(`   > By considering mintBatchEstimatedGas/number of nft as gas per NFT: ${mintBatchEstimatedGas/sub_ids.length}`);
                console.log(`   > You should use at maximum value ${Math.floor( block.gasLimit / (mintBatchEstimatedGas/sub_ids.length))} NFTs per transaction i.e. the MINT SIZE max value` );
                console.log(`   > Therefore, in order to mint all of your collection, you have to send ${Math.ceil( (mintBatchEstimatedGas/sub_ids.length) * ids.length/block.gasLimit)} transactions` );

                mintBatchEstimatedGas = mintBatchEstimatedGas * (ids.length/sub_ids.length);
                console.log(`   > let's approximate mintBatchEstimatedGas as proportion (mintBatchEstimatedGas * (ids.length/sub_ids.length))`);
            }

            console.log('Gas required for batch minting: ', mintBatchEstimatedGas);
            mintBatchCost = mintBatchEstimatedGas * currentGasPrice;
            console.log( `Gas cost estimation = ${web3.utils.fromWei((mintBatchCost).toString(), 'ether')} ${TOKEN}`);       
            if(tokenEurPrice != -1)
                console.log( `\nBatch mint expense in €: ${(Math.round(tokenEurPrice * web3.utils.fromWei((mintBatchCost).toString(), 'ether')* 100)/100).toFixed(3)} €`);

            console.log('======================================================================================');
            console.log('\nBlock gasLimit analysis for BATCH MINTING');
            // This method say us the block gasLimit we do not have to go beyond
            // we have to send a transaction with a lower gas in order to avoid a revert

            console.log('   > Number of NFTs to mint:', ids.length);
            console.log('   > Block gasLimit:', block.gasLimit); 
            console.log(`   > Gas estimanted to batch mint: ${mintBatchEstimatedGas}`);       
            if( block.gasLimit >= mintBatchEstimatedGas ) {
                console.log('   >> OK, gas available to submit  your transaction'); 
            } else {
                console.log('   >> KO!!! mintBatchEstimatedGas is too high! you have to reduce it!');
                console.log(`   > By considering mintBatchEstimatedGas/number of nft as gas per NFT: ${mintBatchEstimatedGas/ids.length}`);
                console.log(`   > You should use at maximum value ${Math.floor( block.gasLimit / (mintBatchEstimatedGas/ids.length))} NFTs per transaction i.e. the MINT SIZE max value` );
            }
        }
        if( deploymentCost != null && mintBatchCost != null) {
            console.log('======================================================================================');
            totalCost = deploymentCost+ mintBatchCost;
            console.log( `\nTOTAL Gas cost estimation = ${web3.utils.fromWei((totalCost).toString(), 'ether')} ${TOKEN}`);
            if(tokenEurPrice != -1)
                console.log( `\nTotal expense in €: ${(Math.round(tokenEurPrice * web3.utils.fromWei((totalCost).toString(), 'ether')* 100)/100).toFixed(3)} €`);
        }
        console.log('======================================================================================');
        console.log('\nAccounts balance analysis');
        for(let account of accounts) {
            let balance = await web3.eth.getBalance(account);
            console.log(`   > Account ${account} - balance: ${web3.utils.fromWei(balance.toString(), 'ether')} ${TOKEN}`);
            if( balance < totalCost ) {
                console.log('!!! ATTENTION!!! Probably, you will not have enough ETH to complete deploy and mint');
                console.log('   >> Try to use another account.');
            } else {
                console.log('   >> OK');
                break; //exit from for
            }
        }
        console.log('======================================================================================');
        console.log('======================================================================================');
    } catch (err) {
        console.log('Error occurred while estimating gas fees\n   >', err);
        process.exit(-1);
    }
    process.exit(1);
}) ();
