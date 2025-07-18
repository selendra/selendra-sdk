import { SelendraSDK } from '../../src';

/**
 * NFT Marketplace Example
 * Demonstrates NFT minting, trading, and marketplace interactions
 */

// ERC-721 NFT Contract ABI
const NFT_ABI = [
  'function mint(address to, uint256 tokenId, string uri) external',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function approve(address to, uint256 tokenId) external',
  'function transferFrom(address from, address to, uint256 tokenId) external',
  'function safeTransferFrom(address from, address to, uint256 tokenId) external',
  'function setApprovalForAll(address operator, bool approved) external',
  'function isApprovedForAll(address owner, address operator) external view returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)'
];

// NFT Marketplace Contract ABI
const MARKETPLACE_ABI = [
  'function listNFT(address nftContract, uint256 tokenId, uint256 price) external',
  'function buyNFT(address nftContract, uint256 tokenId) external payable',
  'function cancelListing(address nftContract, uint256 tokenId) external',
  'function updatePrice(address nftContract, uint256 tokenId, uint256 newPrice) external',
  'function getListing(address nftContract, uint256 tokenId) external view returns (address seller, uint256 price, bool active)',
  'function getListingsByOwner(address owner) external view returns (tuple(address nftContract, uint256 tokenId, uint256 price)[])',
  'event NFTListed(address indexed nftContract, uint256 indexed tokenId, address indexed seller, uint256 price)',
  'event NFTSold(address indexed nftContract, uint256 indexed tokenId, address indexed buyer, uint256 price)'
];

async function nftMarketplaceExample() {
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    await sdk.initialize();
    await sdk.connectWallet('metamask');

    const account = await sdk.evm.getAccount();
    console.log('🎨 Connected account:', account);

    // Contract addresses (replace with actual deployed contracts)
    const nftContractAddress = '0xNFTContract...';
    const marketplaceAddress = '0xMarketplace...';

    // Example 1: Mint NFTs
    await mintNFTExample(sdk, nftContractAddress, account);

    // Example 2: List NFT on marketplace
    await listNFTExample(sdk, nftContractAddress, marketplaceAddress, account);

    // Example 3: Buy NFT from marketplace
    await buyNFTExample(sdk, nftContractAddress, marketplaceAddress);

    // Example 4: Manage NFT collection
    await manageNFTCollectionExample(sdk, nftContractAddress, account);

  } catch (error) {
    console.error('NFT Marketplace example failed:', error);
  } finally {
    await sdk.disconnect();
  }
}

async function mintNFTExample(sdk: SelendraSDK, nftAddress: string, account: string) {
  console.log('\n🪙 === Minting NFTs ===');

  const nftContract = sdk.evm.contract(nftAddress, NFT_ABI);

  try {
    // Mint multiple NFTs
    const nftsToMint = [
      {
        tokenId: 1,
        uri: 'https://api.example.com/metadata/1',
        name: 'Digital Art #1'
      },
      {
        tokenId: 2,
        uri: 'https://api.example.com/metadata/2',
        name: 'Digital Art #2'
      },
      {
        tokenId: 3,
        uri: 'https://api.example.com/metadata/3',
        name: 'Digital Art #3'
      }
    ];

    for (const nft of nftsToMint) {
      console.log(`Minting ${nft.name} (Token ID: ${nft.tokenId})...`);
      
      const mintTx = await nftContract.write('mint', [account, nft.tokenId, nft.uri]);
      console.log('Mint transaction:', mintTx);
      
      await sdk.evm.waitForTransaction(mintTx);
      console.log(`✅ ${nft.name} minted successfully`);
    }

    // Check NFT balance
    const balance = await nftContract.read('balanceOf', [account]);
    console.log(`Total NFTs owned: ${balance.toString()}`);

  } catch (error) {
    console.error('NFT minting failed:', error);
  }
}

async function listNFTExample(
  sdk: SelendraSDK,
  nftAddress: string,
  marketplaceAddress: string,
  account: string
) {
  console.log('\n🏪 === Listing NFTs on Marketplace ===');

  const nftContract = sdk.evm.contract(nftAddress, NFT_ABI);
  const marketplace = sdk.evm.contract(marketplaceAddress, MARKETPLACE_ABI);

  try {
    const tokenId = 1;
    const priceInEther = '0.5'; // 0.5 SEL
    const price = sdk.utils.format.parseEther(priceInEther);

    // First, approve marketplace to transfer NFT
    console.log('Approving marketplace to transfer NFT...');
    const approveTx = await nftContract.write('approve', [marketplaceAddress, tokenId]);
    await sdk.evm.waitForTransaction(approveTx);
    console.log('✅ Marketplace approved');

    // List NFT on marketplace
    console.log(`Listing NFT #${tokenId} for ${priceInEther} SEL...`);
    const listTx = await marketplace.write('listNFT', [nftAddress, tokenId, price]);
    await sdk.evm.waitForTransaction(listTx);
    console.log('✅ NFT listed on marketplace');

    // Verify listing
    const listing = await marketplace.read('getListing', [nftAddress, tokenId]);
    console.log('Listing details:', {
      seller: listing.seller,
      price: sdk.utils.format.formatEther(listing.price),
      active: listing.active
    });

  } catch (error) {
    console.error('NFT listing failed:', error);
  }
}

async function buyNFTExample(
  sdk: SelendraSDK,
  nftAddress: string,
  marketplaceAddress: string
) {
  console.log('\n🛒 === Buying NFT from Marketplace ===');

  const marketplace = sdk.evm.contract(marketplaceAddress, MARKETPLACE_ABI);
  const nftContract = sdk.evm.contract(nftAddress, NFT_ABI);

  try {
    const tokenId = 1;

    // Get listing details
    const listing = await marketplace.read('getListing', [nftAddress, tokenId]);
    if (!listing.active) {
      console.log('NFT is not listed for sale');
      return;
    }

    const price = listing.price;
    const priceInEther = sdk.utils.format.formatEther(price);
    console.log(`Buying NFT #${tokenId} for ${priceInEther} SEL...`);

    // Buy NFT
    const buyTx = await marketplace.write('buyNFT', [nftAddress, tokenId], {
      value: price
    });

    await sdk.evm.waitForTransaction(buyTx);
    console.log('✅ NFT purchased successfully');

    // Verify ownership
    const newOwner = await nftContract.read('ownerOf', [tokenId]);
    console.log('New owner:', newOwner);

  } catch (error) {
    console.error('NFT purchase failed:', error);
  }
}

async function manageNFTCollectionExample(
  sdk: SelendraSDK,
  nftAddress: string,
  account: string
) {
  console.log('\n📚 === Managing NFT Collection ===');

  const nftContract = sdk.evm.contract(nftAddress, NFT_ABI);

  try {
    // Get NFT balance
    const balance = await nftContract.read('balanceOf', [account]);
    console.log(`Total NFTs owned: ${balance.toString()}`);

    // Get details for owned NFTs (simplified - in practice you'd need to track token IDs)
    const ownedNFTs = [1, 2, 3]; // Example token IDs

    for (const tokenId of ownedNFTs) {
      try {
        const owner = await nftContract.read('ownerOf', [tokenId]);
        if (owner.toLowerCase() === account.toLowerCase()) {
          const tokenURI = await nftContract.read('tokenURI', [tokenId]);
          console.log(`NFT #${tokenId}:`, {
            owner,
            tokenURI: tokenURI.substring(0, 50) + '...'
          });
        }
      } catch (error) {
        // Token might not exist or be owned by someone else
        console.log(`NFT #${tokenId}: Not owned or doesn't exist`);
      }
    }

    // Bulk approve for marketplace (more efficient than individual approvals)
    console.log('Setting bulk approval for marketplace...');
    const setApprovalTx = await nftContract.write('setApprovalForAll', [
      '0xMarketplace...', // marketplace address
      true
    ]);
    await sdk.evm.waitForTransaction(setApprovalTx);
    console.log('✅ Bulk approval set for marketplace');

  } catch (error) {
    console.error('NFT collection management failed:', error);
  }
}

// Advanced: Listen to NFT events
async function listenToNFTEvents(sdk: SelendraSDK, nftAddress: string) {
  console.log('\n📡 === Listening to NFT Events ===');

  const nftContract = sdk.evm.contract(nftAddress, NFT_ABI);

  // Listen to Transfer events
  nftContract.on('Transfer', (from, to, tokenId, event) => {
    console.log('🔄 NFT Transfer:', {
      from,
      to,
      tokenId: tokenId.toString(),
      transactionHash: event.transactionHash
    });
  });

  // Listen to Approval events
  nftContract.on('Approval', (owner, approved, tokenId, event) => {
    console.log('✅ NFT Approval:', {
      owner,
      approved,
      tokenId: tokenId.toString(),
      transactionHash: event.transactionHash
    });
  });

  console.log('👂 Listening for NFT events... (Press Ctrl+C to stop)');
}

// Helper function to fetch NFT metadata
async function fetchNFTMetadata(tokenURI: string) {
  try {
    const response = await fetch(tokenURI);
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error('Failed to fetch NFT metadata:', error);
    return null;
  }
}

// Example usage
nftMarketplaceExample().catch(console.error);