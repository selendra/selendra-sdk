import { SelendraSDK } from '../../src';

/**
 * Gaming dApp Example
 * Demonstrates blockchain gaming features including NFTs, tokens, 
 * achievements, leaderboards, and play-to-earn mechanics
 */

// Game Contract ABI
const GAME_CONTRACT_ABI = [
  'function startGame() external returns (uint256 gameId)',
  'function endGame(uint256 gameId, uint256 score, bytes calldata proof) external',
  'function claimRewards(uint256 gameId) external',
  'function getPlayerStats(address player) external view returns (uint256 gamesPlayed, uint256 totalScore, uint256 highScore)',
  'function getLeaderboard(uint256 season) external view returns (address[] memory players, uint256[] memory scores)',
  'function buyItem(uint256 itemId, uint256 quantity) external payable',
  'function equipItem(uint256 tokenId, uint256 itemId) external',
  'function craftItem(uint256[] calldata materials, uint256 recipeId) external returns (uint256 newItemId)',
  'event GameStarted(address indexed player, uint256 indexed gameId)',
  'event GameEnded(address indexed player, uint256 indexed gameId, uint256 score)',
  'event RewardsClaimed(address indexed player, uint256 amount)'
];

// Game NFT ABI (Characters, Items, etc.)
const GAME_NFT_ABI = [
  'function mint(address to, uint256 tokenId, string uri, uint256 rarity) external',
  'function levelUp(uint256 tokenId) external',
  'function getCharacterStats(uint256 tokenId) external view returns (uint256 level, uint256 experience, uint256 attack, uint256 defense)',
  'function getItemStats(uint256 tokenId) external view returns (uint256 itemType, uint256 rarity, uint256 durability)',
  'function upgradeItem(uint256 tokenId, uint256[] calldata materials) external',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function approve(address to, uint256 tokenId) external',
  'function transferFrom(address from, address to, uint256 tokenId) external'
];

// Game Token ABI (In-game currency)
const GAME_TOKEN_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function mint(address to, uint256 amount) external',
  'function burn(uint256 amount) external',
  'function stakingRewards(address player) external view returns (uint256)',
  'function claimStakingRewards() external'
];

// Marketplace ABI
const MARKETPLACE_ABI = [
  'function listItem(address nftContract, uint256 tokenId, uint256 price) external',
  'function buyItem(address nftContract, uint256 tokenId) external payable',
  'function cancelListing(address nftContract, uint256 tokenId) external',
  'function getListings(address nftContract) external view returns (tuple(uint256 tokenId, address seller, uint256 price, bool active)[])',
  'function placeBid(address nftContract, uint256 tokenId, uint256 amount) external',
  'function acceptBid(address nftContract, uint256 tokenId, address bidder) external'
];

interface GameCharacter {
  tokenId: number;
  name: string;
  level: number;
  experience: number;
  attack: number;
  defense: number;
  rarity: number;
  metadata?: any;
}

interface GameItem {
  tokenId: number;
  name: string;
  itemType: number;
  rarity: number;
  durability: number;
  equipped: boolean;
  metadata?: any;
}

interface PlayerStats {
  gamesPlayed: number;
  totalScore: number;
  highScore: number;
  tokenBalance: string;
  characters: GameCharacter[];
  items: GameItem[];
}

class GameIntegration {
  private sdk: SelendraSDK;
  private gameContract: any;
  private nftContract: any;
  private tokenContract: any;
  private marketplace: any;

  constructor(
    sdk: SelendraSDK,
    gameAddress: string,
    nftAddress: string,
    tokenAddress: string,
    marketplaceAddress: string
  ) {
    this.sdk = sdk;
    this.gameContract = sdk.evm.contract(gameAddress, GAME_CONTRACT_ABI);
    this.nftContract = sdk.evm.contract(nftAddress, GAME_NFT_ABI);
    this.tokenContract = sdk.evm.contract(tokenAddress, GAME_TOKEN_ABI);
    this.marketplace = sdk.evm.contract(marketplaceAddress, MARKETPLACE_ABI);
  }

  // Game session management
  async startGameSession(): Promise<number> {
    console.log('🎮 === Starting Game Session ===');

    try {
      const tx = await this.gameContract.write('startGame', []);
      const receipt = await this.sdk.evm.waitForTransaction(tx);
      
      // Parse game started event to get game ID
      const events = await this.gameContract.getEvents('GameStarted', {}, receipt.blockNumber, receipt.blockNumber);
      const gameId = events[0]?.args?.gameId || 1;

      console.log(`✅ Game session started with ID: ${gameId}`);
      return gameId;
    } catch (error) {
      console.error('Failed to start game session:', error);
      throw error;
    }
  }

  async endGameSession(gameId: number, score: number, proof: string = '0x'): Promise<void> {
    console.log('🏁 === Ending Game Session ===');
    console.log(`Game ID: ${gameId}`);
    console.log(`Final Score: ${score}`);

    try {
      const tx = await this.gameContract.write('endGame', [gameId, score, proof]);
      await this.sdk.evm.waitForTransaction(tx);

      console.log('✅ Game session ended successfully');
      
      // Check if rewards are available
      await this.claimGameRewards(gameId);
    } catch (error) {
      console.error('Failed to end game session:', error);
      throw error;
    }
  }

  async claimGameRewards(gameId: number): Promise<void> {
    console.log('🎁 === Claiming Game Rewards ===');

    try {
      const tx = await this.gameContract.write('claimRewards', [gameId]);
      await this.sdk.evm.waitForTransaction(tx);

      console.log('✅ Rewards claimed successfully');
    } catch (error) {
      console.error('Failed to claim rewards:', error);
      throw error;
    }
  }

  // Character management
  async mintCharacter(playerAddress: string, characterData: any): Promise<number> {
    console.log('👤 === Minting Character ===');

    try {
      const tokenId = Date.now(); // Simple ID generation
      const metadataURI = await this.uploadMetadata(characterData);
      
      const tx = await this.nftContract.write('mint', [
        playerAddress,
        tokenId,
        metadataURI,
        characterData.rarity
      ]);

      await this.sdk.evm.waitForTransaction(tx);
      console.log(`✅ Character minted with token ID: ${tokenId}`);

      return tokenId;
    } catch (error) {
      console.error('Character minting failed:', error);
      throw error;
    }
  }

  async levelUpCharacter(tokenId: number): Promise<void> {
    console.log('⬆️ === Leveling Up Character ===');

    try {
      // Check if player owns the character
      const account = await this.sdk.evm.getAccount();
      const owner = await this.nftContract.read('ownerOf', [tokenId]);
      
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error('You do not own this character');
      }

      const tx = await this.nftContract.write('levelUp', [tokenId]);
      await this.sdk.evm.waitForTransaction(tx);

      console.log('✅ Character leveled up successfully');
      
      // Get updated stats
      const stats = await this.getCharacterStats(tokenId);
      console.log('Updated stats:', stats);
    } catch (error) {
      console.error('Level up failed:', error);
      throw error;
    }
  }

  async getCharacterStats(tokenId: number): Promise<GameCharacter> {
    try {
      const [stats, tokenURI] = await Promise.all([
        this.nftContract.read('getCharacterStats', [tokenId]),
        this.nftContract.read('tokenURI', [tokenId])
      ]);

      // Fetch metadata
      const metadata = await this.fetchMetadata(tokenURI);

      return {
        tokenId,
        name: metadata?.name || `Character #${tokenId}`,
        level: Number(stats.level),
        experience: Number(stats.experience),
        attack: Number(stats.attack),
        defense: Number(stats.defense),
        rarity: Number(stats.rarity || 1),
        metadata
      };
    } catch (error) {
      console.error('Failed to get character stats:', error);
      throw error;
    }
  }

  // Item management
  async buyItem(itemId: number, quantity: number, price: string): Promise<void> {
    console.log('🛒 === Buying Item ===');
    console.log(`Item ID: ${itemId}`);
    console.log(`Quantity: ${quantity}`);
    console.log(`Price: ${price} ETH`);

    try {
      const totalPrice = this.sdk.utils.format.parseEther(price);
      
      const tx = await this.gameContract.write('buyItem', [itemId, quantity], {
        value: totalPrice
      });

      await this.sdk.evm.waitForTransaction(tx);
      console.log('✅ Item purchased successfully');
    } catch (error) {
      console.error('Item purchase failed:', error);
      throw error;
    }
  }

  async equipItem(characterTokenId: number, itemId: number): Promise<void> {
    console.log('⚔️ === Equipping Item ===');

    try {
      const tx = await this.gameContract.write('equipItem', [characterTokenId, itemId]);
      await this.sdk.evm.waitForTransaction(tx);

      console.log('✅ Item equipped successfully');
    } catch (error) {
      console.error('Item equipping failed:', error);
      throw error;
    }
  }

  async craftItem(materials: number[], recipeId: number): Promise<number> {
    console.log('🔨 === Crafting Item ===');
    console.log(`Recipe ID: ${recipeId}`);
    console.log(`Materials: ${materials.join(', ')}`);

    try {
      const tx = await this.gameContract.write('craftItem', [materials, recipeId]);
      const receipt = await this.sdk.evm.waitForTransaction(tx);

      // Extract new item ID from events (simplified)
      const newItemId = Date.now(); // In practice, parse from events
      
      console.log(`✅ Item crafted successfully with ID: ${newItemId}`);
      return newItemId;
    } catch (error) {
      console.error('Item crafting failed:', error);
      throw error;
    }
  }

  // Token management
  async getTokenBalance(): Promise<string> {
    try {
      const account = await this.sdk.evm.getAccount();
      const balance = await this.tokenContract.read('balanceOf', [account]);
      return this.sdk.utils.format.formatEther(balance);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }

  async transferTokens(to: string, amount: string): Promise<void> {
    console.log('💸 === Transferring Game Tokens ===');

    try {
      const amountWei = this.sdk.utils.format.parseEther(amount);
      const tx = await this.tokenContract.write('transfer', [to, amountWei]);
      await this.sdk.evm.waitForTransaction(tx);

      console.log('✅ Tokens transferred successfully');
    } catch (error) {
      console.error('Token transfer failed:', error);
      throw error;
    }
  }

  async claimStakingRewards(): Promise<void> {
    console.log('💰 === Claiming Staking Rewards ===');

    try {
      const account = await this.sdk.evm.getAccount();
      const pendingRewards = await this.tokenContract.read('stakingRewards', [account]);
      
      if (BigInt(pendingRewards) === BigInt(0)) {
        console.log('No staking rewards available');
        return;
      }

      const tx = await this.tokenContract.write('claimStakingRewards', []);
      await this.sdk.evm.waitForTransaction(tx);

      const rewardAmount = this.sdk.utils.format.formatEther(pendingRewards);
      console.log(`✅ Claimed ${rewardAmount} tokens in staking rewards`);
    } catch (error) {
      console.error('Staking rewards claim failed:', error);
      throw error;
    }
  }

  // Marketplace functionality
  async listItemForSale(nftContract: string, tokenId: number, price: string): Promise<void> {
    console.log('🏪 === Listing Item for Sale ===');

    try {
      // Approve marketplace to transfer NFT
      const nft = this.sdk.evm.contract(nftContract, GAME_NFT_ABI);
      const approveTx = await nft.write('approve', [this.marketplace.getAddress(), tokenId]);
      await this.sdk.evm.waitForTransaction(approveTx);

      // List item
      const priceWei = this.sdk.utils.format.parseEther(price);
      const listTx = await this.marketplace.write('listItem', [nftContract, tokenId, priceWei]);
      await this.sdk.evm.waitForTransaction(listTx);

      console.log(`✅ Item listed for sale at ${price} ETH`);
    } catch (error) {
      console.error('Item listing failed:', error);
      throw error;
    }
  }

  async buyItemFromMarketplace(nftContract: string, tokenId: number): Promise<void> {
    console.log('🛒 === Buying Item from Marketplace ===');

    try {
      // Get item listing details first
      const listings = await this.marketplace.read('getListings', [nftContract]);
      const listing = listings.find((l: any) => l.tokenId === tokenId && l.active);
      
      if (!listing) {
        throw new Error('Item not found or not active');
      }

      const tx = await this.marketplace.write('buyItem', [nftContract, tokenId], {
        value: listing.price
      });

      await this.sdk.evm.waitForTransaction(tx);
      console.log('✅ Item purchased from marketplace');
    } catch (error) {
      console.error('Marketplace purchase failed:', error);
      throw error;
    }
  }

  // Player statistics and leaderboards
  async getPlayerStats(): Promise<PlayerStats> {
    console.log('📊 === Getting Player Statistics ===');

    try {
      const account = await this.sdk.evm.getAccount();
      
      const [gameStats, tokenBalance] = await Promise.all([
        this.gameContract.read('getPlayerStats', [account]),
        this.getTokenBalance()
      ]);

      // Get player's characters and items (simplified)
      const characters = await this.getPlayerCharacters();
      const items = await this.getPlayerItems();

      const stats: PlayerStats = {
        gamesPlayed: Number(gameStats.gamesPlayed),
        totalScore: Number(gameStats.totalScore),
        highScore: Number(gameStats.highScore),
        tokenBalance,
        characters,
        items
      };

      console.log('Player Statistics:');
      console.log(`  Games Played: ${stats.gamesPlayed}`);
      console.log(`  Total Score: ${stats.totalScore.toLocaleString()}`);
      console.log(`  High Score: ${stats.highScore.toLocaleString()}`);
      console.log(`  Token Balance: ${stats.tokenBalance}`);
      console.log(`  Characters: ${stats.characters.length}`);
      console.log(`  Items: ${stats.items.length}`);

      return stats;
    } catch (error) {
      console.error('Failed to get player stats:', error);
      throw error;
    }
  }

  async getLeaderboard(season: number = 1): Promise<any[]> {
    console.log('🏆 === Getting Leaderboard ===');

    try {
      const leaderboard = await this.gameContract.read('getLeaderboard', [season]);
      const players = leaderboard.players;
      const scores = leaderboard.scores;

      const leaderboardData = players.map((player: string, index: number) => ({
        rank: index + 1,
        player,
        score: Number(scores[index])
      }));

      console.log(`Season ${season} Leaderboard:`);
      leaderboardData.slice(0, 10).forEach(entry => {
        console.log(`  ${entry.rank}. ${entry.player.substring(0, 8)}... - ${entry.score.toLocaleString()}`);
      });

      return leaderboardData;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  // Achievement system
  async checkAchievements(): Promise<any[]> {
    console.log('🏅 === Checking Achievements ===');

    try {
      const stats = await this.getPlayerStats();
      const achievements = [];

      // Check various achievement conditions
      if (stats.gamesPlayed >= 10) {
        achievements.push({ name: 'Dedicated Player', description: 'Play 10 games' });
      }

      if (stats.highScore >= 1000000) {
        achievements.push({ name: 'Score Master', description: 'Achieve score of 1M+' });
      }

      if (stats.characters.length >= 5) {
        achievements.push({ name: 'Collector', description: 'Own 5+ characters' });
      }

      if (stats.characters.some(c => c.level >= 50)) {
        achievements.push({ name: 'Power Leveler', description: 'Reach level 50' });
      }

      console.log(`Unlocked ${achievements.length} achievements:`);
      achievements.forEach(achievement => {
        console.log(`  🏅 ${achievement.name}: ${achievement.description}`);
      });

      return achievements;
    } catch (error) {
      console.error('Achievement check failed:', error);
      return [];
    }
  }

  // Utility functions
  private async getPlayerCharacters(): Promise<GameCharacter[]> {
    // Simplified - in practice, you'd need to track token IDs
    // This could be done through events or a separate mapping
    const characters: GameCharacter[] = [];
    
    // Mock data for demonstration
    for (let i = 1; i <= 3; i++) {
      try {
        const character = await this.getCharacterStats(i);
        const account = await this.sdk.evm.getAccount();
        const owner = await this.nftContract.read('ownerOf', [i]);
        
        if (owner.toLowerCase() === account.toLowerCase()) {
          characters.push(character);
        }
      } catch {
        // Character doesn't exist or not owned
      }
    }

    return characters;
  }

  private async getPlayerItems(): Promise<GameItem[]> {
    // Simplified item retrieval
    const items: GameItem[] = [];
    
    // Mock data for demonstration
    for (let i = 1; i <= 5; i++) {
      try {
        const account = await this.sdk.evm.getAccount();
        const owner = await this.nftContract.read('ownerOf', [1000 + i]); // Item token IDs start at 1000
        
        if (owner.toLowerCase() === account.toLowerCase()) {
          const stats = await this.nftContract.read('getItemStats', [1000 + i]);
          items.push({
            tokenId: 1000 + i,
            name: `Item #${i}`,
            itemType: Number(stats.itemType),
            rarity: Number(stats.rarity),
            durability: Number(stats.durability),
            equipped: false // Would need additional tracking
          });
        }
      } catch {
        // Item doesn't exist or not owned
      }
    }

    return items;
  }

  private async uploadMetadata(data: any): Promise<string> {
    // In practice, this would upload to IPFS or another storage service
    return `https://api.game.com/metadata/${Date.now()}`;
  }

  private async fetchMetadata(uri: string): Promise<any> {
    try {
      const response = await fetch(uri);
      return await response.json();
    } catch {
      return null;
    }
  }
}

// Tournament and guild system
class TournamentSystem {
  private game: GameIntegration;

  constructor(game: GameIntegration) {
    this.game = game;
  }

  async createTournament(name: string, entryFee: string, prizePool: string): Promise<void> {
    console.log('🏟️ === Creating Tournament ===');
    console.log(`Name: ${name}`);
    console.log(`Entry Fee: ${entryFee} ETH`);
    console.log(`Prize Pool: ${prizePool} ETH`);

    // Tournament creation logic would go here
    console.log('✅ Tournament created successfully');
  }

  async joinTournament(tournamentId: number, entryFee: string): Promise<void> {
    console.log(`🎯 Joining tournament ${tournamentId}...`);
    
    // Tournament joining logic would go here
    console.log('✅ Joined tournament successfully');
  }

  async distributePrizes(tournamentId: number, winners: string[], prizes: string[]): Promise<void> {
    console.log('🏆 === Distributing Tournament Prizes ===');
    
    for (let i = 0; i < winners.length; i++) {
      console.log(`  ${i + 1}. ${winners[i]}: ${prizes[i]} ETH`);
    }

    // Prize distribution logic would go here
    console.log('✅ Prizes distributed successfully');
  }
}

async function gamingDappExample() {
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    await sdk.initialize();
    await sdk.connectWallet('metamask');

    console.log('🎮 === Gaming dApp Example ===');

    // Initialize game integration
    const gameAddress = '0xGameContract...';
    const nftAddress = '0xGameNFT...';
    const tokenAddress = '0xGameToken...';
    const marketplaceAddress = '0xMarketplace...';

    const game = new GameIntegration(sdk, gameAddress, nftAddress, tokenAddress, marketplaceAddress);

    // Example 1: Start and end a game session
    const gameId = await game.startGameSession();
    
    // Simulate gameplay
    console.log('🎮 Playing game...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await game.endGameSession(gameId, 85000); // End with score of 85,000

    // Example 2: Character management
    const characterData = {
      name: 'Fire Warrior',
      class: 'warrior',
      rarity: 3,
      attributes: { strength: 80, agility: 60, intelligence: 40 }
    };
    
    const account = await sdk.evm.getAccount();
    const characterTokenId = await game.mintCharacter(account, characterData);
    await game.levelUpCharacter(characterTokenId);

    // Example 3: Item operations
    await game.buyItem(1, 1, '0.1'); // Buy item ID 1, quantity 1, for 0.1 ETH
    await game.equipItem(characterTokenId, 1);

    // Example 4: Crafting
    await game.craftItem([1, 2, 3], 101); // Craft using materials 1,2,3 with recipe 101

    // Example 5: Token operations
    const tokenBalance = await game.getTokenBalance();
    console.log(`Current token balance: ${tokenBalance}`);
    
    await game.claimStakingRewards();

    // Example 6: Marketplace operations
    await game.listItemForSale(nftAddress, characterTokenId, '1.5');
    // await game.buyItemFromMarketplace(nftAddress, anotherTokenId);

    // Example 7: Statistics and achievements
    const playerStats = await game.getPlayerStats();
    const leaderboard = await game.getLeaderboard(1);
    const achievements = await game.checkAchievements();

    // Example 8: Tournament system
    const tournament = new TournamentSystem(game);
    await tournament.createTournament('Weekly Championship', '0.1', '10');
    await tournament.joinTournament(1, '0.1');

    console.log('🎮 Gaming dApp example completed successfully!');

  } catch (error) {
    console.error('Gaming dApp example failed:', error);
  } finally {
    await sdk.disconnect();
  }
}

// Example usage
gamingDappExample().catch(console.error);

export { GameIntegration, TournamentSystem };