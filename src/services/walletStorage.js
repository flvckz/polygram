/**
 * Simple in-memory wallet storage for MVP
 * In production, this should be replaced with a proper database
 */
class WalletStorage {
  constructor() {
    // Store wallet addresses by chat ID
    this.wallets = new Map();
    // Store user states (for tracking wallet input flow)
    this.userStates = new Map();
  }

  /**
   * Save wallet address for a user
   * @param {string} chatId - Telegram chat ID
   * @param {string} walletAddress - User's wallet address
   */
  saveWallet(chatId, walletAddress) {
    this.wallets.set(chatId.toString(), walletAddress.toLowerCase());
    console.log(`Wallet saved for chat ${chatId}: ${walletAddress}`);
  }

  /**
   * Get wallet address for a user
   * @param {string} chatId - Telegram chat ID
   * @returns {string|null} Wallet address or null if not found
   */
  getWallet(chatId) {
    return this.wallets.get(chatId.toString()) || null;
  }

  /**
   * Remove wallet for a user
   * @param {string} chatId - Telegram chat ID
   */
  removeWallet(chatId) {
    this.wallets.delete(chatId.toString());
    console.log(`Wallet removed for chat ${chatId}`);
  }

  /**
   * Check if user has a connected wallet
   * @param {string} chatId - Telegram chat ID
   * @returns {boolean} True if wallet is connected
   */
  hasWallet(chatId) {
    return this.wallets.has(chatId.toString());
  }

  /**
   * Set user state (for tracking input flows)
   * @param {string} chatId - Telegram chat ID
   * @param {string} state - User state
   */
  setUserState(chatId, state) {
    this.userStates.set(chatId.toString(), state);
  }

  /**
   * Get user state
   * @param {string} chatId - Telegram chat ID
   * @returns {string|null} User state or null
   */
  getUserState(chatId) {
    return this.userStates.get(chatId.toString()) || null;
  }

  /**
   * Clear user state
   * @param {string} chatId - Telegram chat ID
   */
  clearUserState(chatId) {
    this.userStates.delete(chatId.toString());
  }

  /**
   * Get all connected wallets (for admin purposes)
   * @returns {Array} Array of {chatId, wallet} objects
   */
  getAllWallets() {
    const wallets = [];
    for (const [chatId, wallet] of this.wallets) {
      wallets.push({ chatId, wallet });
    }
    return wallets;
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage stats
   */
  getStats() {
    return {
      totalWallets: this.wallets.size,
      activeStates: this.userStates.size
    };
  }
}

// Export singleton instance
module.exports = new WalletStorage();