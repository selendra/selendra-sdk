"use strict";
/**
 * EVM client using ethers.js and existing EVM modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmClient = void 0;
const ethers_1 = require("ethers");
/**
 * Client for EVM-specific operations
 */
class EvmClient {
    constructor(provider, config) {
        Object.defineProperty(this, "provider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.provider = provider;
        this.config = config;
    }
    /**
     * Get chain information from EVM
     */
    async getChainInfo() {
        const [network, block] = await Promise.all([
            this.provider.getNetwork(),
            this.provider.getBlock('latest')
        ]);
        return {
            name: network.name || 'selendra',
            chainId: network.chainId.toString(),
            blockNumber: block?.number,
            gasLimit: block?.gasLimit?.toString(),
            // Default Selendra EVM values
            tokenDecimals: 18, // EVM typically uses 18 decimals
            tokenSymbol: 'SEL'
        };
    }
    /**
     * Get balance for an EVM address
     */
    async getBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return {
                address,
                free: balance.toString(),
                reserved: '0',
                frozen: '0',
                total: balance.toString()
            };
        }
        catch (error) {
            throw new Error(`Failed to get balance for ${address}: ${error}`);
        }
    }
    /**
     * Transfer tokens between EVM addresses
     */
    async transfer(from, privateKey, to, amount, options) {
        try {
            const wallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
            // Parse amount to wei
            const parsedAmount = ethers_1.ethers.parseEther(amount);
            // Get nonce if not provided
            const nonce = options?.nonce ?? await this.provider.getTransactionCount(from);
            // Create transaction
            const tx = {
                to,
                value: parsedAmount,
                nonce,
                data: options?.data || '0x',
                gasLimit: options?.gasLimit || '21000',
                gasPrice: options?.gasPrice || (await this.provider.getFeeData()).gasPrice
            };
            // Send transaction
            const sentTx = await wallet.sendTransaction(tx);
            return {
                hash: sentTx.hash,
                from,
                to,
                amount,
                status: 'pending',
                blockNumber: undefined,
                blockHash: undefined,
                gasUsed: undefined,
                gasPrice: tx.gasPrice?.toString(),
                nonce: nonce.toString()
            };
        }
        catch (error) {
            throw new Error(`Transfer failed: ${error}`);
        }
    }
    /**
     * Get transaction status
     */
    async getTransactionStatus(txHash) {
        try {
            const [receipt, tx] = await Promise.all([
                this.provider.getTransactionReceipt(txHash),
                this.provider.getTransaction(txHash)
            ]);
            if (!receipt) {
                return { status: 'pending' };
            }
            return {
                status: receipt.status === 1 ? 'success' : 'failed',
                blockNumber: receipt.blockNumber,
                blockHash: receipt.blockHash,
                gasUsed: receipt.gasUsed?.toString(),
                gasPrice: tx?.gasPrice?.toString(),
                logs: receipt.logs
            };
        }
        catch (error) {
            return { status: 'pending' };
        }
    }
    /**
     * Wait for transaction confirmation
     */
    async waitForTransaction(txHash, confirmations = 1) {
        try {
            const [receipt, tx] = await Promise.all([
                this.provider.waitForTransaction(txHash, confirmations),
                this.provider.getTransaction(txHash)
            ]);
            if (!receipt) {
                throw new Error('Transaction not found');
            }
            return {
                status: receipt.status === 1 ? 'success' : 'failed',
                blockNumber: receipt.blockNumber,
                blockHash: receipt.blockHash,
                gasUsed: receipt.gasUsed?.toString() || '0',
                gasPrice: tx?.gasPrice?.toString() || '0',
                logs: receipt.logs || []
            };
        }
        catch (error) {
            throw new Error(`Transaction confirmation failed: ${error}`);
        }
    }
    /**
     * Get current block number
     */
    async getBlockNumber() {
        return await this.provider.getBlockNumber();
    }
    /**
     * Get block information
     */
    async getBlock(blockNumber) {
        const block = await this.provider.getBlock(blockNumber);
        if (!block) {
            throw new Error(`Block ${blockNumber} not found`);
        }
        return {
            number: block.number,
            hash: block.hash || '',
            parentHash: block.parentHash || '',
            timestamp: block.timestamp,
            transactions: block.transactions.map(tx => typeof tx === 'string' ? tx : tx.hash)
        };
    }
    /**
     * Estimate gas for a transaction
     */
    async estimateGas(from, to, amount, data) {
        try {
            const parsedAmount = ethers_1.ethers.parseEther(amount);
            const gasEstimate = await this.provider.estimateGas({
                from,
                to,
                value: parsedAmount,
                data: data || '0x'
            });
            return gasEstimate.toString();
        }
        catch (error) {
            throw new Error(`Gas estimation failed: ${error}`);
        }
    }
    /**
     * Get gas price
     */
    async getGasPrice() {
        const feeData = await this.provider.getFeeData();
        return feeData.gasPrice?.toString() || '0';
    }
    /**
     * Get fee data
     */
    async getFeeData() {
        const feeData = await this.provider.getFeeData();
        return {
            gasPrice: feeData.gasPrice?.toString() || '0',
            maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || '0'
        };
    }
    /**
     * Call a smart contract method (read-only)
     */
    async call(to, data, from) {
        try {
            const result = await this.provider.call({
                to,
                data,
                from
            });
            return result;
        }
        catch (error) {
            throw new Error(`Contract call failed: ${error}`);
        }
    }
    /**
     * Send raw transaction
     */
    async sendRawTransaction(signedTx) {
        try {
            const hash = await this.provider.broadcastTransaction(signedTx);
            return hash;
        }
        catch (error) {
            throw new Error(`Failed to broadcast transaction: ${error}`);
        }
    }
    /**
     * Get transaction count (nonce) for an address
     */
    async getTransactionCount(address) {
        return await this.provider.getTransactionCount(address);
    }
    /**
     * Get transaction by hash
     */
    async getTransaction(txHash) {
        const tx = await this.provider.getTransaction(txHash);
        if (!tx) {
            throw new Error(`Transaction ${txHash} not found`);
        }
        return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to || '',
            value: tx.value.toString(),
            gasPrice: tx.gasPrice?.toString() || '0',
            gasLimit: tx.gasLimit?.toString() || '0',
            nonce: tx.nonce,
            data: tx.data || '0x'
        };
    }
    /**
     * Get logs matching filter criteria
     */
    async getLogs(filter) {
        try {
            const logs = await this.provider.getLogs(filter);
            return logs;
        }
        catch (error) {
            throw new Error(`Failed to get logs: ${error}`);
        }
    }
    /**
     * Get the underlying provider instance
     */
    getProvider() {
        return this.provider;
    }
}
exports.EvmClient = EvmClient;
//# sourceMappingURL=evm.js.map