const axios = require('axios');

class PolymarketService {
  constructor() {
    this.gammaApi = axios.create({
      baseURL: 'https://gamma-api.polymarket.com',
      timeout: 10000,
    });

    this.dataApi = axios.create({
      baseURL: 'https://data-api.polymarket.com',
      timeout: 10000,
    });

    this.clobApi = axios.create({
      baseURL: 'https://clob.polymarket.com',
      timeout: 10000,
    });
  }

  /**
   * Get user positions from Polymarket
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Array>} Array of user positions
   */
  async getUserPositions(walletAddress) {
    try {
      console.log(`Fetching positions for wallet: ${walletAddress}`);
      
      // Get user's positions from the Data API
      const response = await this.dataApi.get(`/positions`, {
        params: {
          user: walletAddress.toLowerCase(),
          limit: 100
        }
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }
      
      const positions = response.data;
      const formattedPositions = [];
      
      for (const position of positions) {
        try {
          const formattedPosition = {
            id: position.conditionId,
            market: position.title || 'Unknown Market',
            marketId: position.conditionId,
            tokenId: position.asset,
            side: position.outcome || 'Unknown',
            amount: parseFloat(position.size || 0),
            avgPrice: parseFloat(position.avgPrice || 0),
            currentPrice: parseFloat(position.curPrice || 0),
            value: parseFloat(position.currentValue || 0),
            initialValue: parseFloat(position.initialValue || 0),
            pnl: parseFloat(position.cashPnl || 0),
            percentPnl: parseFloat(position.percentPnl || 0),
            status: 'ACTIVE',
            redeemable: position.redeemable || false,
            mergeable: position.mergeable || false
          };
          
          formattedPositions.push(formattedPosition);
        } catch (error) {
          console.error(`Error processing position ${position.conditionId}:`, error);
        }
      }
      
      return formattedPositions;
      
    } catch (error) {
      console.error('Error fetching user positions:', error);
      throw new Error('Failed to fetch user positions');
    }
  }

  /**
   * Calculate user's total PNL
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} PNL summary object
   */
  async getUserPNL(walletAddress) {
    try {
      console.log(`Calculating PNL for wallet: ${walletAddress}`);
      
      const positions = await this.getUserPositions(walletAddress);
      const trades = await this.getUserTrades(walletAddress);
      
      let totalPnl = 0;
      let realizedPnl = 0;
      let unrealizedPnl = 0;
      let totalVolume = 0;
      let winningTrades = 0;
      
      // Calculate from positions (unrealized PNL)
      positions.forEach(position => {
        unrealizedPnl += position.pnl;
        totalPnl += position.pnl;
      });
      
      // Calculate from trades (realized PNL and volume)
      trades.forEach(trade => {
        totalVolume += trade.volume;
        if (trade.pnl > 0) {
          winningTrades++;
        }
        realizedPnl += trade.pnl;
      });
      
      totalPnl += realizedPnl;
      
      const winRate = trades.length > 0 ? (winningTrades / trades.length * 100).toFixed(1) : 0;
      const activeSince = this.getActiveSince(trades);
      
      return {
        totalPnl: parseFloat(totalPnl.toFixed(2)),
        realizedPnl: parseFloat(realizedPnl.toFixed(2)),
        unrealizedPnl: parseFloat(unrealizedPnl.toFixed(2)),
        totalVolume: parseFloat(totalVolume.toFixed(2)),
        totalTrades: trades.length,
        winRate: parseFloat(winRate),
        activeSince
      };
      
    } catch (error) {
      console.error('Error calculating user PNL:', error);
      throw new Error('Failed to calculate PNL');
    }
  }

  /**
   * Get user's trading history
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Array>} Array of trades
   */
  async getUserTrades(walletAddress) {
    try {
      const response = await this.dataApi.get(`/trades`, {
        params: {
          user: walletAddress.toLowerCase(),
          limit: 1000
        }
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }
      
      return response.data.map(trade => ({
        id: trade.conditionId,
        market: trade.title || 'Unknown Market',
        side: trade.side,
        size: parseFloat(trade.size || 0),
        price: parseFloat(trade.price || 0),
        volume: parseFloat(trade.size || 0) * parseFloat(trade.price || 0),
        timestamp: new Date(trade.timestamp * 1000), // Convert from Unix timestamp
        pnl: 0 // PNL calculation would need more complex logic
      }));
      
    } catch (error) {
      console.error('Error fetching user trades:', error);
      return [];
    }
  }

  /**
   * Get active markets from Polymarket
   * @returns {Promise<Array>} Array of active markets
   */
  async getActiveMarkets() {
    try {
      const response = await this.gammaApi.get('/markets', {
        params: {
          limit: 20,
          active: true,
          order: 'volume24hr',
          ascending: false
        }
      });
      
      if (!response.data || !response.data.data) {
        return [];
      }
      
      return response.data.data.map(market => ({
        id: market.id,
        question: market.question,
        description: market.description,
        volume: parseFloat(market.volume24hr || 0),
        yesPrice: parseFloat(market.tokens?.[0]?.price || 0) * 100, // Convert to cents
        noPrice: parseFloat(market.tokens?.[1]?.price || 0) * 100,
        endDate: new Date(market.end_date_iso),
        category: market.category,
        image: market.image
      }));
      
    } catch (error) {
      console.error('Error fetching active markets:', error);
      throw new Error('Failed to fetch market data');
    }
  }

  /**
   * Get market details by ID
   * @param {string} marketId - Market ID
   * @returns {Promise<Object>} Market details
   */
  async getMarketById(marketId) {
    try {
      const response = await this.gammaApi.get(`/markets/${marketId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error);
      return null;
    }
  }

  /**
   * Get current price for a token
   * @param {string} tokenId - Token ID
   * @returns {Promise<number>} Current price
   */
  async getCurrentPrice(tokenId) {
    try {
      const response = await this.clobApi.get(`/price`, {
        params: {
          token_id: tokenId
        }
      });
      
      return parseFloat(response.data?.price || 0);
    } catch (error) {
      console.error(`Error fetching price for token ${tokenId}:`, error);
      return 0;
    }
  }

  /**
   * Calculate PNL for a position
   * @param {Object} position - Position object
   * @returns {number} PNL value
   */
  calculatePositionPNL(position) {
    // This is a simplified calculation
    // In reality, you'd need current market prices and more complex logic
    const avgPrice = parseFloat(position.avg_price || 0);
    const size = parseFloat(position.size || 0);
    const currentPrice = 0.5; // Placeholder - should get real current price
    
    if (position.side === 'BUY') {
      return (currentPrice - avgPrice) * size;
    } else {
      return (avgPrice - currentPrice) * size;
    }
  }

  /**
   * Calculate PNL for a trade (placeholder)
   * @param {Object} trade - Trade object
   * @returns {number} PNL value
   */
  calculateTradePNL(trade) {
    // Placeholder implementation
    // Real implementation would require more complex logic
    return 0;
  }

  /**
   * Get the date when user became active
   * @param {Array} trades - Array of trades
   * @returns {string} Formatted date string
   */
  getActiveSince(trades) {
    if (trades.length === 0) {
      return 'No trading history';
    }
    
    const oldestTrade = trades.reduce((oldest, trade) => {
      return trade.timestamp < oldest.timestamp ? trade : oldest;
    });
    
    return oldestTrade.timestamp.toLocaleDateString();
  }

  /**
   * Validate wallet address format
   * @param {string} address - Wallet address
   * @returns {boolean} Is valid address
   */
  isValidWalletAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

module.exports = new PolymarketService();