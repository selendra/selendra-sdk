"use strict";
/**
 * Substrate-specific client using @polkadot/api
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubstrateClient = void 0;
const api_1 = require("@polkadot/api");
/**
 * Client for Substrate-specific operations
 */
class SubstrateClient {
    constructor(api, config) {
        Object.defineProperty(this, "api", {
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
        Object.defineProperty(this, "keyring", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.api = api;
        this.config = config;
        this.keyring = new api_1.Keyring({
            type: 'sr25519',
            ss58Format: config.ss58Format || 42
        });
    }
    /**
     * Get chain information from Substrate
     */
    async getChainInfo() {
        const [chain, version, properties] = await Promise.all([
            this.api.rpc.system.chain(),
            this.api.rpc.system.version(),
            this.api.rpc.system.properties()
        ]);
        const genesisHash = this.api.genesisHash.toHex();
        const runtimeVersion = this.api.runtimeVersion;
        return {
            name: chain.toString(),
            version: version.toString(),
            genesisHash,
            specVersion: runtimeVersion.specVersion.toString(),
            implVersion: runtimeVersion.implVersion.toString(),
            ss58Format: this.config.ss58Format || 42,
            // Token decimals from chain properties
            tokenDecimals: properties.tokenDecimals.unwrapOrDefault().toArray()[0]?.toNumber() || 12,
            // Token symbol from chain properties
            tokenSymbol: properties.tokenSymbol.unwrapOrDefault().toArray()[0]?.toString() || 'SEL'
        };
    }
    /**
     * Get balance for a Substrate address
     */
    async getBalance(address) {
        try {
            const { data } = await this.api.query.system.account(address);
            return {
                address,
                free: data.free.toString(),
                reserved: data.reserved.toString(),
                frozen: data.frozen.toString(),
                total: data.free.add(data.reserved).toString()
            };
        }
        catch (error) {
            throw new Error(`Failed to get balance for ${address}: ${error}`);
        }
    }
    /**
     * Transfer tokens between Substrate addresses
     */
    async transfer(from, to, amount, options) {
        try {
            // Get account info for nonce
            const { nonce } = await this.api.query.system.account(from);
            // Create transfer call
            const transfer = this.api.tx.balances.transferAllowDeath(to, amount);
            // Create and sign transaction
            const tx = await transfer.signAsync(this.keyring.addFromAddress(from), {
                nonce: options?.nonce ?? nonce,
                tip: options?.tip,
                era: options?.mortal ? this.api.createType('ExtrinsicEra', {
                    current: this.api.runtimeVersion.specVersion.toNumber(),
                    period: options?.era || 64
                }) : 0
            });
            // Send transaction
            const hash = await tx.send();
            return {
                hash: hash.toHex(),
                from,
                to,
                amount: amount.toString(),
                status: 'pending',
                blockNumber: undefined,
                blockHash: undefined,
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
            const hash = this.api.createType('Hash', txHash);
            const { block, index } = await this.api.rpc.chain.getBlock(hash);
            if (!block) {
                return { status: 'pending' };
            }
            const allRecords = await this.api.query.system.events.at(block.hash);
            const record = allRecords[index.toNumber()];
            const events = [];
            let status = 'failed';
            if (record) {
                for (const { event } of record.event) {
                    events.push({
                        section: event.section,
                        method: event.method,
                        data: event.data
                    });
                    if (event.section === 'system' && event.method === 'ExtrinsicSuccess') {
                        status = 'success';
                    }
                }
            }
            return {
                status,
                blockNumber: block.header.number.toNumber(),
                blockHash: block.hash.toHex(),
                events
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
        return new Promise((resolve, reject) => {
            let currentBlock = 0;
            let targetBlock = 0;
            const unsub = this.api.rpc.chain.subscribeNewHeads(async (header) => {
                currentBlock = header.number.toNumber();
                if (currentBlock === 0)
                    return;
                if (targetBlock === 0) {
                    const status = await this.getTransactionStatus(txHash);
                    if (status.blockNumber) {
                        targetBlock = status.blockNumber + confirmations;
                    }
                }
                if (targetBlock > 0 && currentBlock >= targetBlock) {
                    unsub();
                    const finalStatus = await this.getTransactionStatus(txHash);
                    if (finalStatus.status === 'pending') {
                        reject(new Error('Transaction timeout'));
                        return;
                    }
                    resolve({
                        status: finalStatus.status,
                        blockNumber: finalStatus.blockNumber,
                        blockHash: finalStatus.blockHash,
                        events: finalStatus.events || []
                    });
                }
            });
        });
    }
    /**
     * Get current block number
     */
    async getBlockNumber() {
        const header = await this.api.rpc.chain.getHeader();
        return header.number.toNumber();
    }
    /**
     * Get block information
     */
    async getBlock(blockNumber) {
        let hash;
        if (blockNumber === 'latest') {
            hash = await this.api.rpc.chain.getBlockHash();
        }
        else {
            hash = await this.api.rpc.chain.getBlockHash(blockNumber);
        }
        const block = await this.api.rpc.chain.getBlock(hash);
        const timestamp = (await this.api.query.timestamp.now.at(hash)).toNumber();
        return {
            number: block.block.header.number.toNumber(),
            hash: block.block.hash.toHex(),
            parentHash: block.block.header.parentHash.toHex(),
            timestamp,
            transactions: block.block.extrinsics.map((ext) => ext.hash.toHex())
        };
    }
    /**
     * Get account information
     */
    async getAccountInfo(address) {
        const account = await this.api.query.system.account(address);
        return {
            nonce: account.nonce.toNumber(),
            refCount: account.refCount.toNumber(),
            free: account.data.free.toString(),
            reserved: account.data.reserved.toString(),
            frozen: account.data.frozen.toString()
        };
    }
    /**
     * Get staking information
     */
    async getStakingInfo(address) {
        const staking = await this.api.query.staking.ledger(address);
        if (staking.isNone) {
            return { active: '0', unlocking: [] };
        }
        const ledger = staking.unwrap();
        const unlocking = ledger.unlocking.map(({ value, era }) => ({
            amount: value.toString(),
            era: era.toNumber()
        }));
        return {
            active: ledger.active.toString(),
            unlocking
        };
    }
    /**
     * Get governance information
     */
    async getGovernanceInfo() {
        const [referendumCount, proposalCount, activeProposals] = await Promise.all([
            this.api.query.democracy.referendumCount(),
            this.api.query.democracy.publicPropCount(),
            this.api.query.democracy.referendumInfoOf.entries()
        ]);
        const proposals = activeProposals
            .filter(([, info]) => info.isOngoing)
            .map(([key, info]) => ({
            index: key.args[0].toNumber(),
            hash: key.toHex(),
            title: info.asOngoing.proposal.lookupHash.toHex()
        }));
        return {
            referendumCount: referendumCount.toNumber(),
            proposalCount: proposalCount.toNumber(),
            activeProposals: proposals
        };
    }
    /**
     * Get the underlying API instance
     */
    getApi() {
        return this.api;
    }
}
exports.SubstrateClient = SubstrateClient;
//# sourceMappingURL=substrate.js.map