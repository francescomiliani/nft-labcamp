# OpenSea NFTs Bulk Minter and Lister

This project allows to bulk upload and list NFTs on the OpenSea platform.

The idea stems from the need to upload, and subsequently list, massively, i.e. > 1K, NFTs on the NFT OpenSea marketplace. A task which if done by hand, takes an enormous amount of time, as well as being tedious and error-prone.

This project creates a **ERC1155** smart contract and then deploys it to Görli/Goerli testnet/ Mumbai testnet/ Polygon mainnet or Ethereum mainnet.

NFT's can then be minted in bulk by sending transaction to the deployed smart contract.

After that, the **listing** process can be made via the usage of the **OpenSea.js** library (here the [`link`](https://github.com/ProjectOpenSea/opensea-js)).

## Foreword:

In order to simply run the package, there is a **sample_images** folder containing pics of lovely kitties :heart_eyes:. You can copy some pics from it and paste into **images** folder. **Remember that** your future NTFs collection should be loaded into this latter folder.

### Dependencies:
 - `NodeJS v16`

    This versions can be installed via NVM for a greater flexibility, or by using following commands:
```bash
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs
# Test your installation
node -v
npm -v
```

 - `cURL`
 
    Needed to verify deployment and install yarn. Follow next commands:
 ```bash
sudo apt-get update
sudo apt-get install curl -y
 ```
 
-   `Yarn v1.22.4`
    
    Follow next commands:
 ```bash
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update
sudo apt-get install yarn=1.22.4-1 -y
 ```

## Requirements

### MetaMask

If you don't have a MetaMask account, download [`Metamask`](https://metamask.io/) browser extension and create it a new one. Please, take note of your secret **phrase seed** because it will have to set to **MNEMONIC** enviroment variable inside `.env` file.

### Infura

If you don't have an [`Infura.io`](https://infura.io/) account, go to https://infura.io/ and create it a new one. 
After that, you have to:
1) create a new project and take note of your **Project ID** because it will have to set to **INFURA_PROJECT_ID** enviroment variable inside `.env` file.
2) create an **IPFS project** and take note of your **Project ID** and **API KEY** because it will have to set to, respectively, **IPFS_INFURA_PROJECT_ID** and **IPFS_INFURA_PROJECT_SECRET** enviroment variables inside `.env` file.


### Non-zero wallets balance

In order to launch the script executing the contract upload and listing, due to gas fees consumption reasons, you should ask for faucet tokens (ETH/MATIC) belonging the chain you wish to use. E.g. if you want deploy your collection on Polygon Testnet (i.e. Mumbai), your Mumbai wallet on Metamask has to contain some MATICs.

You can use the following links:
 
- **Goerli**: https://goerlifaucet.com/
- **Mumbai**: https://mumbaifaucet.com/

The minimum amount of required tokens is: **0.1** 

### Enviroment setting 

1. Clone the project repo with command `git clone https://github.com/francescomiliani/nft-labcamp` and cd into `nft-labcamp` folder.

2. Install node_modules packages and project dependencies for **batch minting part** by executing on your terminal under the root of the project:

 ```bash
npm install
```

3. Install node_modules packages and project dependencies for **listing part** by executing on your terminal under the **lister** of the project:

 ```bash
cd lister && yarn
```

4. To use <em>from-terminal-deploying</em> and perform <em>the listing</em>, rename **.env.sample** file in **.env** and update following environment variables:
  - **MNEMONIC**: with your MetaMask seed phrase;
  - **INFURA_PROJECT_ID**: with the Project ID created on Infura.io;
  - **IPFS_INFURA_PROJECT_ID**: with the IPFS Project ID created on Infura.io;
  - **IPFS_INFURA_PROJECT_SECRET**: with the IPFS Api Key Secret created on Infura.io;
  - **OWNER_ADDRES**: account address within Metamask you have a non-zero balance;
  - **OPENSEA_API_KEY**: requested via [OpenSea form](https://docs.opensea.io/reference/request-an-api-key) for production activities e.g. Ethereum mainnet 


## Usage

This project can be used to deploy smart contract in two ways:

-   Using **Remix & MetaMask** 
-   From terminal by updating .env files with credentials.
    -   via **Truffle** framework to deploy the smart contract

1.  Create a folder named `images` and put images you want to convert into NFTs inside this latter.

2.  Run `node utils/rename-images-to-numbered-sequence.js` to convert filenames in images directory to hexadecimal format and link them to metadata.

3.  Upload `images` folder to Pinata and grag the CID of the folder. Then, update the **images_ipfs_location.txt** replacing the template string with the CID received from Pinata.

4.  Run `node scripts/create_metadata_from_template.js` to create a metadata file for each image under `metadata` directory.

5.  Upload `metadata` folder to Pinata and grab the CID to update the smart contract `ArtCollectible.sol` file later.

6.  Either deploy contract using **Remix** or deploy via **terminal**:
   - A) Deploy via `Remix`
       - Update the metadata CID in `ArtCollectible.sol` inside constructor by replacing **METADATA_IPFS_CID_TO_REPLACE** string;
       - Under the section `Solidity compiler`, click on **Compile ArtCollectible.sol**. The `Contract` section should appear if the compilation was successful;
       - Under the section `Deploy and run transactions`:
          - Select **Injected Provider - MetaMask** under Environment;
          - Select the **Account** you asked for faucets previously;
          - Click on **Deploy**;
          - Confirm the transaction via MetaMask;
          - Once completed, you should see the transaction receipt on Remix log and the MetaMask transaction confirmation as notification on your browser;
   - B) Deploy via `terminal`
       - Update the metadata CID in `ArtCollectible.sol` inside constructor by replacing **METADATA_IPFS_CID_TO_REPLACE** string;
       - Update your account **MNEMONIC** in `.env` file;
       - Run `truffle migrate --network {mainnet|goerli|polygon|mumbai}` e.g. `truffle migrate --network goerli`  to migrate your collection on Goerli testnet;
       - If migration was successful, you should see the contract address where was deployed; 

7.  Estimate batch mint gas fees:
    - A) Via `Remix`, updating smart contract address in **remix_scripts/estimate_gas_fees.js** file and right-click and then **Run**.
    - B) Via `terminal`, using the command `node scripts/estimate_gas_fees.js <network> <smart_contract_address>`, where you have to substitute <network> with:
      - **mainnet**: Ethereum mainnet
      - **goerli**: Goerli Ethereum testnet
      - **polygon**: Polygon mainnet
      - **mumbai**: Polygon testnet
      - <del>rinkeby: Rinkeby Ethereum testnet</del> [DEPRECATED since October 5th 2022]

8.  Check the file **tokenIDs.txt** containing a comma-separated list of ID (e.g. 1,2,3,4,5) and run the `scripts/bulk_mint_nfts.js` script to mint your NFTs' collection, by using the command `node scripts/bulk_mint_nfts.js`.

9.  Verify the deploy and mint both via OpenSea API and OpenSea website:
   - Via API, you can run the following command `node scripts/deploy_verify.js <network>` (see above example for network values);
   - Via Browser, please read "OpenSea collection import" section

10.  Modify the **collection_descriptor.json** file with your collection name, a <em>description</em>, the <em>listing price</em> for each NFT and the <em>payment token</em> (please, check OpenSea documentation about the latter parameter).

11.   List your collection by running <em>listing.js</em> script from lister folder, specifying the network you deployed your collection
    `cd lister && node listing.js <network>`

### OpenSea collection import [**Update June 2022**]

During second part of 2022, OpenSea removed the "Import an existing smart contract" functionality from "My Collections" section.
You can see and verify your just deployed smart contract/collection by using both where after asset you have to replace <smart contract address\> and <token id\> within a similar template as: `https://api.opensea.io/asset/<smart contract address>/<token id>/validate/`
You can verify the correct deploy either via web browser on **OpenSea web site** or via **API**:
  - **Direct link on Web Browser**:
    - **OpenSea Testnet**:
       - **Goerli implicit**: https://testnets.opensea.io/assets/0xEd91C1A1Ffeb90C9DB60712E97cbef5686587bb6/1
       - **Goerli**: https://testnets.opensea.io/assets/goerli/0xEd91C1A1Ffeb90C9DB60712E97cbef5686587bb6/1
       - **Mumbai**: https://testnets.opensea.io/assets/mumbai/0x1A38Df5ceAca9Ffe6AE5c420651f00C71854e618/1
       - **<del>Rinkeby<del>** **[DEPRECATED on October 5th 2022]**: https://testnets.opensea.io/assets/rinkeby/0xf958c3d3eE76DF3d273a5f58A6e31EC4C0220813/1
       - An example:
   ![image](https://user-images.githubusercontent.com/75777914/191922470-0441aaa9-db44-4df6-915c-24974e0b32b8.png) 
   
     - **OpenSea Mainnet**:
        - **Ethereum implicit**: https://opensea.io/assets/<smart contract address\>/<token id\>
        - **Ethereum**: https://opensea.io/assets/ethereum/<smart contract address\>/<token id\> 
        - **Polygon**:  https://opensea.io/assets/matic/<smart contract address\>/<token id\>
 
  - **API**:
     - (1) Get Asset (Mumbai NOT available)
       - **OpenSea Testnet**:
         - **Goerli implicit**: https://testnets-api.opensea.io/asset/0xEd91C1A1Ffeb90C9DB60712E97cbef5686587bb6/1/
         -  An example:
 ![image](https://user-images.githubusercontent.com/75777914/199030586-9191c860-4d89-46c4-af37-8160dfc9f39c.png)
 
       - **OpenSea Mainnet**:
         - **Ethereum implicit**: https://api.opensea.io/asset/<smart contract address\>/\<token id\>/
 
      - (2) Validate Asset
        - **OpenSea Testnet**:
           - **Goerli implicit**: https://testnets-api.opensea.io/asset/0xEd91C1A1Ffeb90C9DB60712E97cbef5686587bb6/1/validate 
           - **Goerli**: https://testnets-api.opensea.io/asset/goerli/0xEd91C1A1Ffeb90C9DB60712E97cbef5686587bb6/1/validate
           - **Mumbai**: https://testnets-api.opensea.io/asset/mumbai/0x1A38Df5ceAca9Ffe6AE5c420651f00C71854e618/1/validate
           - **<del>Rinkeby<del>** **[DEPRECATED on October 5th 2022]**: https://testnets-api.opensea.io/asset/rinkeby/0xf958c3d3eE76DF3d273a5f58A6e31EC4C0220813/1/validate
           - An example:
![image](https://user-images.githubusercontent.com/75777914/199030829-c4d0b2c4-3d5d-4a5d-b58b-79b6a91bce66.png)
 
        - **OpenSea Mainnet**:
           - **Ethereum implicit**: https://api.opensea.io/asset/<smart contract address\>/\<token id\>/validate
           - **Ethereum**: https://api.opensea.io/asset/ethereum/<smart contract address\>/\<token id\>/validate 
           - **Polygon**: https://api.opensea.io/asset/matic/<smart contract address\>/\<token id\>/validate

You can click on your collection name link on the right to see your entire NFT collection with all images.

### OpenSea NFTs listing - In-Depth Analysis

You can change listing/sell price multiple times, as many as you want: follow the step #11 by updating the collection_descriptor.json file and re-running the command illustrated.

If your listing was successful, on OpenSea web site, you can prowdly admire your listing, and your overall work, by observing your NFTs listed at the price you set and with a <em>expiration date</em> (become mandatory with [`last OpenSea documentation update`](https://docs.opensea.io/changelog/limits-on-order-expiration-time)

![image](https://user-images.githubusercontent.com/75777914/194736373-24b505a0-6c79-4047-b9cf-4fa7b53bd14c.png)

Furthermore, you can use additional payment tokens, not only ETH, for instance:
- Testnet: ETH, DAI, UDSC, TER, WETH
- Mainnet: ETH, APE, VOLT, ASH, NCT, GALA, UNI, REVV, LINK, MANA, CUBE, BAT, USDC, WETH, DAI, SAND

In order to find an updated list, at the moment you are reading, you can the the script **getPaymentTokens.js** via:

```bash
cd lister
node getPaymentTokens.js {mainnet|goerli}
```

![immagine](https://user-images.githubusercontent.com/75777914/194739134-39561432-6bc9-4c0a-9752-074dadfe8f09.png)

### :100: THAT'S ALL FOLKS! :100:	:partying_face: :champagne:

Finally, **THAT'S ALL FOLKS!**	:partying_face:


## :rotating_light: PLEASE KEEP MIND ! :watch:

If you receive a "404 Page not found" or "404 This Page is lost" by OpenSea, don't worry :wink:
If you deployed your contract on Ethereum, Goerli or Mumbai could be need at least 10 minutes.
So, let's wait and retry later!
And, you can run the script <em>deploy_verify.js</em> with network name as parameter, after have been created a file called **smart_contract_address.txt** containing the smart contract address, received from either Remix or Truffle, from where the script read.

 ```bash
node scripts/deploy_verify.js {mainnet|goerli|polygon|mumbai}
```

## :rotating_light: Disclaimer :rotating_light:

Unfortunately, at the moment I'm publishing this code, Polygon network is not supported yet by the library OpenSea.js.
The only two supported networks are: Mainnet (Ethereum) and Goerli <del>Rinkeby</del> (an Ethereum testnet).
Therefore, you can still use this program to bulk upload your NFTs on Polygon, but, you will make the listing activity on OpenSea just on Ethereum and Goerli <del>Rinkeby</del>.
 
<ins>On Mumbai and Polygon, you have to list every NFT manually via OpenSea UI.</ins>

**Update June 2022**
 
Due to ETH 2.0 release, Rinkeby and other testnet e.g. Ropsten have been deprecated, and they will be shutdown on 2023. You can read the announcement [`here`](https://blog.ethereum.org/2022/06/21/testnet-deprecation).
This means that **OpenSea testnet API are referring to Goerli** and not to Rinkeby anymore.
