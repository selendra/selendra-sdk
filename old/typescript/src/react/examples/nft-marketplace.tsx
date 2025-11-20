/**
 * NFT Marketplace Template
 *
 * A comprehensive NFT marketplace template featuring gallery/list views,
 * advanced filtering, bidding system, and collection management on Selendra.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  SelendraProvider,
  ThemeProvider,
  WalletConnector,
  BalanceDisplay,
  ConnectionStatus,
  TransactionButton,
  LoadingSkeleton,
  ErrorBoundary
} from '../components';
import {
  useSelendraSDK,
  useBalance,
  useAccount,
  useContract
} from '../hooks';
import {
  formatBalance,
  formatTimestamp,
  formatAddress,
  truncateString,
  copyToClipboard
} from '../utils';
import { NFTMarketplaceTemplateProps } from '../types';

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  creator: string;
  owner: string;
  price: string;
  currency: string;
  endTime?: number;
  bids?: Bid[];
  attributes?: Attribute[];
  metadata?: any;
}

interface Bid {
  bidder: string;
  amount: string;
  timestamp: number;
}

interface Attribute {
  traitType: string;
  value: string;
  rarity?: number;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  floorPrice: string;
  volume24h: string;
  itemsCount: number;
}

/**
 * Filter Sidebar Component
 */
function FilterSidebar({
  filters,
  onFilterChange
}: {
  filters: any;
  onFilterChange: (filters: any) => void;
}) {
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

  const collections = ['Selendra Punks', 'Digital Art', 'Gaming Items', 'Music NFTs'];
  const traits = ['Background', 'Eyes', 'Clothing', 'Accessories'];

  const handlePriceRangeChange = (type: 'min' | 'max', value: string) => {
    const newRange = { ...priceRange, [type]: value };
    setPriceRange(newRange);
    onFilterChange({ ...filters, priceRange: newRange });
  };

  const handleCollectionToggle = (collection: string) => {
    const newCollections = selectedCollections.includes(collection)
      ? selectedCollections.filter(c => c !== collection)
      : [...selectedCollections, collection];
    setSelectedCollections(newCollections);
    onFilterChange({ ...filters, collections: newCollections });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Price Range</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min</label>
            <input
              type="number"
              value={priceRange.min}
              onChange={(e) => handlePriceRangeChange('min', e.target.value)}
              placeholder="0 SEL"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max</label>
            <input
              type="number"
              value={priceRange.max}
              onChange={(e) => handlePriceRangeChange('max', e.target.value)}
              placeholder="1000 SEL"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Collections</h3>
        <div className="space-y-2">
          {collections.map((collection) => (
            <label key={collection} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedCollections.includes(collection)}
                onChange={() => handleCollectionToggle(collection)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{collection}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Status</h3>
        <div className="space-y-2">
          {['Buy Now', 'On Auction', 'New'].map((status) => (
            <label key={status} className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{status}</span>
            </label>
          ))}
        </div>
      </div>

      <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Apply Filters
      </button>
    </div>
  );
}

/**
 * NFT Card Component
 */
function NFTCard({ nft, onBid, onBuy }: {
  nft: NFT;
  onBid: (nft: NFT) => void;
  onBuy: (nft: NFT) => void;
}) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <div className={`aspect-square bg-gray-200 ${isImageLoading ? 'animate-pulse' : ''}`}>
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover"
            onLoad={() => setIsImageLoading(false)}
          />
        </div>
        {nft.endTime && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
            Auction
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
          {nft.collection}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{nft.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{nft.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-gray-500">Current Price</div>
            <div className="font-bold text-lg">
              {formatBalance({ balance: nft.price, symbol: nft.currency, decimals: 18 } as any)}
            </div>
          </div>
          {nft.endTime && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Ends In</div>
              <div className="font-medium text-red-600">
                {formatTimestamp(nft.endTime, { relative: true })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center text-sm text-gray-500 mb-3">
          <span className="mr-2">Created by</span>
          <span className="font-mono">{formatAddress(nft.creator, 6)}</span>
        </div>

        <div className="flex space-x-2">
          {nft.endTime ? (
            <button
              onClick={() => onBid(nft)}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              Place Bid
            </button>
          ) : (
            <button
              onClick={() => onBuy(nft)}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Buy Now
            </button>
          )}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            Details
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <div className="mb-2">
                <strong>Owner:</strong> {formatAddress(nft.owner, 6)}
              </div>
              {nft.bids && nft.bids.length > 0 && (
                <div className="mb-2">
                  <strong>Bids:</strong> {nft.bids.length}
                </div>
              )}
              {nft.attributes && nft.attributes.length > 0 && (
                <div>
                  <strong>Attributes:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {nft.attributes.map((attr, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 px-2 py-1 rounded text-xs"
                      >
                        {attr.traitType}: {attr.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * NFT Gallery Component
 */
function NFTGallery({
  nfts,
  viewMode,
  onBid,
  onBuy
}: {
  nfts: NFT[];
  viewMode: 'gallery' | 'list';
  onBid: (nft: NFT) => void;
  onBuy: (nft: NFT) => void;
}) {
  if (viewMode === 'gallery') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft) => (
          <NFTCard
            key={nft.id}
            nft={nft}
            onBid={onBid}
            onBuy={onBuy}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {nfts.map((nft) => (
        <div key={nft.id} className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{nft.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{nft.description}</p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-500">Collection: {nft.collection}</span>
              <span className="text-gray-500">Creator: {formatAddress(nft.creator, 6)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg mb-2">
              {formatBalance({ balance: nft.price, symbol: nft.currency, decimals: 18 } as any)}
            </div>
            <div className="flex space-x-2">
              {nft.endTime ? (
                <button
                  onClick={() => onBid(nft)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  Place Bid
                </button>
              ) : (
                <button
                  onClick={() => onBuy(nft)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Buy Now
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Bid Modal Component
 */
function BidModal({ nft, onClose, onSubmit }: {
  nft: NFT;
  onClose: () => void;
  onSubmit: (bid: string) => void;
}) {
  const [bidAmount, setBidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!bidAmount) return;

    try {
      setIsLoading(true);
      await onSubmit(bidAmount);
      onClose();
    } catch (error) {
      console.error('Bid failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Place Bid</h2>

        <div className="mb-4">
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-48 object-cover rounded-lg mb-2"
          />
          <h3 className="font-semibold">{nft.name}</h3>
          <p className="text-sm text-gray-600">{nft.collection}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bid Amount (SEL)
          </label>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="0.0"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {nft.bids && nft.bids.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Recent Bids</h4>
            <div className="space-y-1">
              {nft.bids.slice(0, 3).map((bid, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{formatAddress(bid.bidder, 6)}</span>
                  <span>{formatBalance({ balance: bid.amount, symbol: 'SEL', decimals: 18 } as any)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !bidAmount}
            className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
          >
            {isLoading ? 'Placing Bid...' : 'Place Bid'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main NFT Marketplace Component
 */
export function NFTMarketplace({
  collectionAddress,
  showGallery = true,
  showList = true,
  enableFilters = true,
  itemsPerPage = 20,
  className,
  style
}: NFTMarketplaceTemplateProps): JSX.Element {
  const { isConnected, account } = useSelendraSDK();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('price_low_high');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const loadNFTs = async () => {
      try {
        setIsLoading(true);

        // Mock NFT data - in real app, this would come from your smart contracts or API
        const mockNfts: NFT[] = Array.from({ length: 50 }, (_, i) => ({
          id: `nft-${i + 1}`,
          name: `Selendra NFT #${i + 1}`,
          description: `A unique digital collectible from the Selendra ecosystem. This NFT represents a piece of digital art created on the Selendra blockchain.`,
          image: `https://picsum.photos/400/400?random=${i}`,
          collection: ['Selendra Punks', 'Digital Art', 'Gaming Items'][Math.floor(Math.random() * 3)],
          creator: `0x${Math.random().toString(16).substr(2, 40)}`,
          owner: `0x${Math.random().toString(16).substr(2, 40)}`,
          price: (Math.random() * 100).toString(),
          currency: 'SEL',
          endTime: Math.random() > 0.7 ? Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000 : undefined,
          bids: Math.random() > 0.5 ? [
            {
              bidder: `0x${Math.random().toString(16).substr(2, 40)}`,
              amount: (Math.random() * 50).toString(),
              timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000
            }
          ] : [],
          attributes: [
            { traitType: 'Background', value: 'Blue' },
            { traitType: 'Eyes', value: 'Green' }
          ]
        }));

        setNfts(mockNfts);
        setFilteredNfts(mockNfts);
      } catch (error) {
        console.error('Failed to load NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isConnected) {
      loadNFTs();
    }
  }, [isConnected]);

  // Apply filters
  useEffect(() => {
    let filtered = [...nfts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(nft =>
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.collection.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price filter
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      if (min) {
        filtered = filtered.filter(nft => parseFloat(nft.price) >= parseFloat(min));
      }
      if (max) {
        filtered = filtered.filter(nft => parseFloat(nft.price) <= parseFloat(max));
      }
    }

    // Collection filter
    if (filters.collections && filters.collections.length > 0) {
      filtered = filtered.filter(nft => filters.collections.includes(nft.collection));
    }

    // Sort
    switch (sortBy) {
      case 'price_low_high':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price_high_low':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'newest':
        filtered.sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]));
        break;
      case 'ending_soon':
        filtered.sort((a, b) => {
          if (!a.endTime) return 1;
          if (!b.endTime) return -1;
          return a.endTime - b.endTime;
        });
        break;
    }

    setFilteredNfts(filtered);
  }, [nfts, searchTerm, filters, sortBy]);

  const handleBid = (nft: NFT) => {
    setSelectedNft(nft);
    setShowBidModal(true);
  };

  const handleBuy = async (nft: NFT) => {
    try {
      console.log('Buying NFT:', nft);
      // Implement purchase logic here
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const handleBidSubmit = async (bidAmount: string) => {
    if (!selectedNft) return;

    try {
      console.log('Placing bid:', bidAmount, 'on NFT:', selectedNft.id);
      // Implement bid logic here
    } catch (error) {
      console.error('Bid failed:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">NFT Marketplace</h1>
          <p className="text-center text-gray-600 mb-8">
            Connect your wallet to browse and trade NFTs on Selendra
          </p>
          <div className="flex justify-center">
            <WalletConnector
              buttonLabel="Connect Wallet"
              variant="primary"
              size="lg"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className || ''}`} style={style}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">NFT Marketplace</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectionStatus compact />
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search NFTs, collections, and creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="price_low_high">Price: Low to High</option>
              <option value="price_high_low">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="ending_soon">Ending Soon</option>
            </select>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('gallery')}
                className={`px-3 py-1 rounded ${viewMode === 'gallery' ? 'bg-white shadow-sm' : ''}`}
              >
                Gallery
              </button>
              {showList && (
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  List
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {enableFilters && (
            <div className="w-64 flex-shrink-0">
              <FilterSidebar
                filters={filters}
                onFilterChange={setFilters}
              />
            </div>
          )}

          {/* NFT Gallery */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <LoadingSkeleton key={i} variant="card" />
                ))}
              </div>
            ) : filteredNfts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">No NFTs found</div>
                <p className="text-gray-400">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <NFTGallery
                nfts={filteredNfts}
                viewMode={viewMode}
                onBid={handleBid}
                onBuy={handleBuy}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && selectedNft && (
        <BidModal
          nft={selectedNft}
          onClose={() => {
            setShowBidModal(false);
            setSelectedNft(null);
          }}
          onSubmit={handleBidSubmit}
        />
      )}
    </div>
  );
}

/**
 * Complete NFT Marketplace with Providers
 */
export function NFTMarketplaceApp(props: NFTMarketplaceTemplateProps): JSX.Element {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SelendraProvider
          initialConfig={{
            chainType: 'substrate',
            endpoint: 'wss://rpc.selendra.org'
          }}
          autoConnect={false}
        >
          <NFTMarketplace {...props} />
        </SelendraProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default NFTMarketplaceApp;