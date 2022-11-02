// Right click on the script name and hit 'Run' to execute
(async () => {
    try {
        console.log('Running estimate_gas_fees script...');

        const totalNfts = 1000;   // number of NFTs to mint // TO REPLACE
        const contract_address = 'YOUR_DEPLOYED_CONTRACT_ADDRESS'; // TO REPLACE
        
        const contractName = 'ArtCollectible'; // Change this for other contract

        console.log(`totalNfts: ${totalNfts}`);
        console.log(`contract_address: ${contract_address}`);
        console.log(`contractName: ${contractName}`);

        if( contract_address == 'YOUR_DEPLOYED_CONTRACT_ADDRESS') {
            console.log('   > contract address not set. SKIP batch mint gas cost estimation!');
            return;
        }
        // ===================================================================================
        // Note that the script needs the ABI which is generated from the compilation artifact.
        // Make sure contract is compiled and artifacts are generated
        const artifactsPath = `browser/contracts/artifacts/${contractName}.json`; // Change this for different path

        const metadata = JSON.parse(
            await remix.call('fileManager', 'getFile', artifactsPath)
        );
        const accounts = await web3.eth.getAccounts();

        const artCollectible = new web3.eth.Contract(
            metadata.abi,
            contract_address,
            {
                from: accounts[0]
            }
        );
        
        console.log("=============================================================================");

        console.log('\nBulk minting gas estimation...\n');

        const block = await web3.eth.getBlock('latest');

        const ids = getTokenIds(1, totalNfts); // [1,2,3 ... 100]
        let amounts = getAmounts(totalNfts); // [1,1,1 ... 1]
        console.log('Token ids => ', ids);
        console.log('Amounts => ', amounts);
        let mintBatchEstimatedGas = 0;
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
        const gasPrice = await web3.eth.getGasPrice();
        console.log('Estimated network gas price:', gasPrice);
        // https://etherscan.io/gastracker

        //console.log('Gas cost estimation = ' + mintBatchEstimatedGas * gasPrice + ' wei');
        console.log('Gas cost estimation = ' + web3.utils.fromWei((mintBatchEstimatedGas * gasPrice).toString(), 'ether') +' ETH');

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
            console.log(`   > By considering mintBatchEstimatedGas/number of nft as gas per NFT: ${mintBatchEstimatedGas/totalNfts}`);
            console.log(`   > You should use at maximum value ${Math.floor( block.gasLimit / (mintBatchEstimatedGas/totalNfts))} NFTs per transaction i.e. the MINT SIZE max value` );
        }

    } catch (e) {
        console.log(e.message);
    }
})();

function getTokenIds(startTokenId, size) {
    return Array(size)
        .fill()
        .map((element, index) => index + startTokenId);
}

function getAmounts(size) {
    return Array(size).fill(1);
}