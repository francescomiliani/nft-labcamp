const fs = require('fs');
const path = require('path');
const constants = require('../scripts/constants');
const SMART_CONTRACT_ADDRESS_FILE_NAME = constants.ConstantsObject.SMART_CONTRACT_ADDRESS_FILE_NAME;
const SMART_CONTRACT_ADDRESS_FILE_PATH = path.resolve(__dirname, '..',SMART_CONTRACT_ADDRESS_FILE_NAME);

const artCollectible = artifacts.require('ArtCollectible');

module.exports = async function (deployer) {
    // deploy a contract
    await deployer.deploy(artCollectible);

    //access information about your deployed contract instance
    const instance = await artCollectible.deployed();

    console.log(`ArtCollectible smart contract address: ${instance.address}`);
    fs.writeFile( SMART_CONTRACT_ADDRESS_FILE_PATH, instance.address, 'utf8', function (err) {
        if (err) {
            console.log(`error occurred while creating ${SMART_CONTRACT_ADDRESS_FILE_NAME}. Error: ${err}`);
            return;
        }

        console.log(`${SMART_CONTRACT_ADDRESS_FILE_NAME} created successfully!`);
    });
};
