//! EVM Event Handling
//!
//! Event monitoring, filtering, and processing for EVM-compatible chains.

use crate::types::{Result, SDKError};
use crate::evm::client::EVMClient;
use ethers::core::{
    types::{
        Address, U256, H256, Log, Filter, FilterBlockOption, BlockNumber,
        Topic, TxHash, ValueOrArray, Block, Transaction, TxpoolContent, TxpoolInspect,
        TransactionReceipt, Bloom, BloomInput,
    },
    utils::keccak256,
};
use ethers::providers::{Middleware, StreamExt, WatchStream};
use std::collections::{HashMap, HashSet};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use std::sync::Arc;
use tokio::sync::RwLock;
use futures::stream::Stream;
use serde::{Serialize, Deserialize};

/// Event listener configuration
#[derive(Debug, Clone)]
pub struct EventListenerConfig {
    /// Addresses to listen to (None for all)
    pub addresses: Option<Vec<Address>>,
    /// Event signatures to listen to (None for all)
    pub topics: Option<Vec<H256>>,
    /// From block (inclusive)
    pub from_block: Option<BlockNumber>,
    /// To block (inclusive)
    pub to_block: Option<BlockNumber>,
    /// Polling interval in milliseconds
    pub poll_interval_ms: u64,
    /// Maximum batch size for log queries
    pub batch_size: u64,
    /// Enable real-time streaming (requires WebSocket)
    pub enable_streaming: bool,
}

impl Default for EventListenerConfig {
    fn default() -> Self {
        Self {
            addresses: None,
            topics: None,
            from_block: Some(BlockNumber::Latest),
            to_block: None,
            poll_interval_ms: 1000,
            batch_size: 1000,
            enable_streaming: true,
        }
    }
}

/// Processed event with decoded data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedEvent {
    /// Event signature
    pub signature: H256,
    /// Event name (if available)
    pub name: Option<String>,
    /// Contract address that emitted the event
    pub contract_address: Address,
    /// Block number where event occurred
    pub block_number: u64,
    /// Block hash
    pub block_hash: H256,
    /// Transaction hash
    pub transaction_hash: H256,
    /// Transaction index
    pub transaction_index: u64,
    /// Log index
    pub log_index: u64,
    /// Event topics
    pub topics: Vec<H256>,
    /// Event data
    pub data: Vec<u8>,
    /// Decoded parameters (if available)
    pub parameters: Option<Vec<EventParameter>>,
    /// Timestamp when event was processed
    pub processed_at: u64,
}

/// Event parameter with decoded value
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventParameter {
    /// Parameter name
    pub name: String,
    /// Parameter type
    pub r#type: String,
    /// Parameter value (as string)
    pub value: String,
    /// Whether parameter is indexed
    pub indexed: bool,
}

/// Event listener for monitoring blockchain events
pub struct EventListener {
    client: EVMClient,
    config: EventListenerConfig,
    event_handlers: Arc<RwLock<HashMap<H256, Vec<Arc<dyn EventHandler>>>>>,
    running: Arc<RwLock<bool>>,
}

impl EventListener {
    /// Create a new event listener
    pub fn new(client: EVMClient, config: EventListenerConfig) -> Self {
        Self {
            client,
            config,
            event_handlers: Arc::new(RwLock::new(HashMap::new())),
            running: Arc::new(RwLock::new(false)),
        }
    }

    /// Register an event handler for a specific event signature
    pub async fn register_handler(
        &self,
        event_signature: H256,
        handler: Arc<dyn EventHandler>,
    ) {
        let mut handlers = self.event_handlers.write().await;
        handlers.entry(event_signature).or_insert_with(Vec::new).push(handler);
    }

    /// Start listening for events
    pub async fn start(&self) -> Result<EventStream> {
        let mut running = self.running.write().await;
        if *running {
            return Err(SDKError::AlreadyRunning("Event listener is already running".to_string()));
        }
        *running = true;

        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();

        // Start background task for event processing
        let client = self.client.clone();
        let config = self.config.clone();
        let event_handlers = self.event_handlers.clone();

        tokio::spawn(async move {
            if let Err(e) = Self::event_processing_loop(
                client,
                config,
                event_handlers,
                tx,
            ).await {
                log::error!("Event processing loop error: {:?}", e);
            }
        });

        Ok(EventStream::new(rx))
    }

    /// Stop the event listener
    pub async fn stop(&self) {
        let mut running = self.running.write().await;
        *running = false;
    }

    /// Get historical events
    pub async fn get_historical_events(
        &self,
        from_block: BlockNumber,
        to_block: BlockNumber,
    ) -> Result<Vec<ProcessedEvent>> {
        let mut filter = Filter::default();

        // Set address filter
        if let Some(addresses) = &self.config.addresses {
            filter = filter.address(ValueOrArray::Array(addresses.clone()));
        }

        // Set topic filter
        if let Some(topics) = &self.config.topics {
            if !topics.is_empty() {
                filter = filter.topic1(ValueOrArray::Array(topics.clone()));
            }
        }

        // Set block range
        filter = filter
            .from_block(from_block)
            .to_block(to_block);

        // Query logs
        let logs = self.client.get_logs(&filter).await?;

        // Process logs
        let mut processed_events = Vec::new();
        for log in logs {
            if let Some(event) = self.process_log(&log).await? {
                processed_events.push(event);
            }
        }

        Ok(processed_events)
    }

    /// Process a single log into a ProcessedEvent
    async fn process_log(&self, log: &Log) -> Result<Option<ProcessedEvent>> {
        if let Some(topics) = &log.topics {
            if topics.is_empty() {
                return Ok(None);
            }

            let signature = topics[0];
            let block_number = log.block_number.unwrap_or_default().as_u64();
            let block_hash = log.block_hash.unwrap_or_default();
            let transaction_hash = log.transaction_hash.unwrap_or_default();
            let transaction_index = log.transaction_index.unwrap_or_default().as_u64();
            let log_index = log.log_index.unwrap_or_default().as_u64();

            let processed_event = ProcessedEvent {
                signature,
                name: None, // Would need ABI to decode name
                contract_address: log.address,
                block_number,
                block_hash,
                transaction_hash,
                transaction_index,
                log_index,
                topics: topics.clone(),
                data: log.data.clone().to_vec(),
                parameters: None, // Would need ABI to decode parameters
                processed_at: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
            };

            Ok(Some(processed_event))
        } else {
            Ok(None)
        }
    }

    /// Main event processing loop
    async fn event_processing_loop(
        client: EVMClient,
        config: EventListenerConfig,
        event_handlers: Arc<RwLock<HashMap<H256, Vec<Arc<dyn EventHandler>>>>>,
        tx: tokio::sync::mpsc::UnboundedSender<ProcessedEvent>,
    ) -> Result<()> {
        let mut last_block = match config.from_block {
            Some(BlockNumber::Number(n)) => n,
            _ => client.get_block_number().await?,
        };

        loop {
            // Check if we should continue running
            // In a real implementation, you'd have a proper cancellation mechanism

            // Get current block number
            let current_block = client.get_block_number().await?;

            if current_block > last_block {
                // Query for new events
                let mut filter = Filter::default();

                if let Some(addresses) = &config.addresses {
                    filter = filter.address(ValueOrArray::Array(addresses.clone()));
                }

                if let Some(topics) = &config.topics {
                    if !topics.is_empty() {
                        filter = filter.topic1(ValueOrArray::Array(topics.clone()));
                    }
                }

                filter = filter
                    .from_block(BlockNumber::Number(last_block + 1))
                    .to_block(BlockNumber::Number(current_block));

                let logs = client.get_logs(&filter).await?;

                // Process logs
                for log in logs {
                    if let Some(processed_event) = Self::process_log_sync(&log)? {
                        // Call handlers
                        let handlers = event_handlers.read().await;
                        if let Some(event_handlers) = handlers.get(&processed_event.signature) {
                            for handler in event_handlers {
                                handler.handle_event(&processed_event).await;
                            }
                        }

                        // Send to stream
                        if let Err(_) = tx.send(processed_event) {
                            // Channel closed, stop processing
                            return Ok(());
                        }
                    }
                }

                last_block = current_block;
            }

            // Wait before next poll
            tokio::time::sleep(Duration::from_millis(config.poll_interval_ms)).await;
        }
    }

    /// Synchronous version of log processing
    fn process_log_sync(log: &Log) -> Result<Option<ProcessedEvent>> {
        if let Some(topics) = &log.topics {
            if topics.is_empty() {
                return Ok(None);
            }

            let signature = topics[0];
            let block_number = log.block_number.unwrap_or_default().as_u64();
            let block_hash = log.block_hash.unwrap_or_default();
            let transaction_hash = log.transaction_hash.unwrap_or_default();
            let transaction_index = log.transaction_index.unwrap_or_default().as_u64();
            let log_index = log.log_index.unwrap_or_default().as_u64();

            let processed_event = ProcessedEvent {
                signature,
                name: None,
                contract_address: log.address,
                block_number,
                block_hash,
                transaction_hash,
                transaction_index,
                log_index,
                topics: topics.clone(),
                data: log.data.clone().to_vec(),
                parameters: None,
                processed_at: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
            };

            Ok(Some(processed_event))
        } else {
            Ok(None)
        }
    }
}

/// Stream of processed events
pub struct EventStream {
    receiver: tokio::sync::mpsc::UnboundedReceiver<ProcessedEvent>,
}

impl EventStream {
    /// Create a new event stream
    fn new(receiver: tokio::sync::mpsc::UnboundedReceiver<ProcessedEvent>) -> Self {
        Self { receiver }
    }

    /// Get the next event
    pub async fn next(&mut self) -> Option<ProcessedEvent> {
        self.receiver.recv().await
    }

    /// Get the next event with timeout
    pub async fn next_timeout(&mut self, timeout: Duration) -> Option<ProcessedEvent> {
        tokio::time::timeout(timeout, self.next()).await.ok()?
    }

    /// Convert to a futures Stream
    pub fn into_stream(self) -> impl Stream<Item = ProcessedEvent> + Unpin {
        futures::stream::unfold(self, |mut state| async move {
            match state.next().await {
                Some(event) => Some((event, state)),
                None => None,
            }
        })
    }
}

/// Trait for handling events
#[async_trait::async_trait]
pub trait EventHandler: Send + Sync {
    /// Handle an event
    async fn handle_event(&self, event: &ProcessedEvent);
}

/// Simple function-based event handler
pub struct FunctionEventHandler<F>
where
    F: Fn(&ProcessedEvent) + Send + Sync,
{
    handler_fn: F,
}

impl<F> FunctionEventHandler<F>
where
    F: Fn(&ProcessedEvent) + Send + Sync,
{
    /// Create a new function event handler
    pub fn new(handler_fn: F) -> Self {
        Self { handler_fn }
    }
}

#[async_trait::async_trait]
impl<F> EventHandler for FunctionEventHandler<F>
where
    F: Fn(&ProcessedEvent) + Send + Sync,
{
    async fn handle_event(&self, event: &ProcessedEvent) {
        (self.handler_fn)(event);
    }
}

/// Event filter builder
pub struct EventFilterBuilder {
    addresses: Option<Vec<Address>>,
    topics: Option<Vec<H256>>,
    from_block: Option<BlockNumber>,
    to_block: Option<BlockNumber>,
}

impl Default for EventFilterBuilder {
    fn default() -> Self {
        Self {
            addresses: None,
            topics: None,
            from_block: None,
            to_block: None,
        }
    }
}

impl EventFilterBuilder {
    /// Create a new filter builder
    pub fn new() -> Self {
        Self::default()
    }

    /// Set addresses to filter
    pub fn addresses(mut self, addresses: Vec<Address>) -> Self {
        self.addresses = Some(addresses);
        self
    }

    /// Add an address to filter
    pub fn add_address(mut self, address: Address) -> Self {
        self.addresses.get_or_insert_with(Vec::new).push(address);
        self
    }

    /// Set topics to filter
    pub fn topics(mut self, topics: Vec<H256>) -> Self {
        self.topics = Some(topics);
        self
    }

    /// Add a topic to filter
    pub fn add_topic(mut self, topic: H256) -> Self {
        self.topics.get_or_insert_with(Vec::new).push(topic);
        self
    }

    /// Set from block
    pub fn from_block(mut self, from_block: BlockNumber) -> Self {
        self.from_block = Some(from_block);
        self
    }

    /// Set to block
    pub fn to_block(mut self, to_block: BlockNumber) -> Self {
        self.to_block = Some(to_block);
        self
    }

    /// Build the filter
    pub fn build(self) -> Filter {
        let mut filter = Filter::default();

        if let Some(addresses) = self.addresses {
            filter = filter.address(ValueOrArray::Array(addresses));
        }

        if let Some(topics) = self.topics {
            if !topics.is_empty() {
                filter = filter.topic1(ValueOrArray::Array(topics));
            }
        }

        if let Some(from_block) = self.from_block {
            filter = filter.from_block(from_block);
        }

        if let Some(to_block) = self.to_block {
            filter = filter.to_block(to_block);
        }

        filter
    }

    /// Build the event listener config
    pub fn build_config(self, poll_interval_ms: u64) -> EventListenerConfig {
        EventListenerConfig {
            addresses: self.addresses,
            topics: self.topics,
            from_block: self.from_block,
            to_block: self.to_block,
            poll_interval_ms,
            batch_size: 1000,
            enable_streaming: true,
        }
    }
}

/// Event cache for storing and retrieving events
pub struct EventCache {
    events: Arc<RwLock<HashMap<H256, ProcessedEvent>>>,
    by_block: Arc<RwLock<HashMap<u64, Vec<H256>>>>,
    by_address: Arc<RwLock<HashMap<Address, Vec<H256>>>>,
}

impl EventCache {
    /// Create a new event cache
    pub fn new() -> Self {
        Self {
            events: Arc::new(RwLock::new(HashMap::new())),
            by_block: Arc::new(RwLock::new(HashMap::new())),
            by_address: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Add an event to the cache
    pub async fn add_event(&self, event: ProcessedEvent) {
        let event_hash = H256::from_slice(&keccak256(&serde_json::to_vec(&event).unwrap_or_default()));

        // Add to main cache
        self.events.write().await.insert(event_hash, event.clone());

        // Add to block index
        self.by_block.write().await
            .entry(event.block_number)
            .or_insert_with(Vec::new)
            .push(event_hash);

        // Add to address index
        self.by_address.write().await
            .entry(event.contract_address)
            .or_insert_with(Vec::new)
            .push(event_hash);
    }

    /// Get event by hash
    pub async fn get_event(&self, hash: H256) -> Option<ProcessedEvent> {
        self.events.read().await.get(&hash).cloned()
    }

    /// Get events by block
    pub async fn get_events_by_block(&self, block_number: u64) -> Vec<ProcessedEvent> {
        let by_block = self.by_block.read().await;
        let events = self.events.read().await;

        if let Some(event_hashes) = by_block.get(&block_number) {
            event_hashes.iter()
                .filter_map(|hash| events.get(hash).cloned())
                .collect()
        } else {
            Vec::new()
        }
    }

    /// Get events by address
    pub async fn get_events_by_address(&self, address: Address) -> Vec<ProcessedEvent> {
        let by_address = self.by_address.read().await;
        let events = self.events.read().await;

        if let Some(event_hashes) = by_address.get(&address) {
            event_hashes.iter()
                .filter_map(|hash| events.get(hash).cloned())
                .collect()
        } else {
            Vec::new()
        }
    }

    /// Get events in block range
    pub async fn get_events_in_range(&self, from_block: u64, to_block: u64) -> Vec<ProcessedEvent> {
        let events = self.events.read().await;
        events.values()
            .filter(|event| event.block_number >= from_block && event.block_number <= to_block)
            .cloned()
            .collect()
    }

    /// Clear old events (before specified block)
    pub async fn clear_before(&self, block_number: u64) {
        let mut events = self.events.write().await;
        let mut by_block = self.by_block.write().await;
        let mut by_address = self.by_address.write().await;

        // Remove events from main cache
        events.retain(|_, event| event.block_number >= block_number);

        // Remove from block index
        by_block.retain(|block_num, _| block_num >= &block_number);

        // Rebuild address index
        by_address.clear();
        for event in events.values() {
            by_address.entry(event.contract_address)
                .or_insert_with(Vec::new)
                .push(H256::default()); // Simplified - in real implementation, use proper hash
        }
    }
}

/// Event statistics and analytics
pub struct EventAnalytics {
    cache: EventCache,
}

impl EventAnalytics {
    /// Create new event analytics
    pub fn new(cache: EventCache) -> Self {
        Self { cache }
    }

    /// Count events per block
    pub async fn count_events_per_block(&self, block_numbers: &[u64]) -> HashMap<u64, usize> {
        let mut counts = HashMap::new();

        for &block_num in block_numbers {
            let events = self.cache.get_events_by_block(block_num).await;
            counts.insert(block_num, events.len());
        }

        counts
    }

    /// Get most active contracts
    pub async fn get_most_active_contracts(&self, limit: usize) -> Vec<(Address, usize)> {
        let mut contract_counts = HashMap::new();

        // This is simplified - in a real implementation, you'd scan the cache
        // and count events per contract address

        let mut counts: Vec<(Address, usize)> = contract_counts.into_iter().collect();
        counts.sort_by(|a, b| b.1.cmp(&a.1));
        counts.truncate(limit);
        counts
    }

    /// Get event frequency over time
    pub async fn get_event_frequency(&self, window_size: u64) -> Vec<(u64, usize)> {
        // This would implement sliding window analysis
        // For now, return empty
        Vec::new()
    }
}

/// Utility functions for event handling
pub mod utils {
    use super::*;

    /// Calculate event signature hash
    pub fn calculate_event_signature(event_name: &str, parameters: &[(&str, &str)]) -> H256 {
        let param_types: Vec<&str> = parameters.iter().map(|(_, param_type)| *param_type).collect();
        let signature = format!("{}({})", event_name, param_types.join(","));
        H256::from_slice(&keccak256(signature.as_bytes()))
    }

    /// Check if an event matches a filter
    pub fn event_matches_filter(
        event: &ProcessedEvent,
        addresses: Option<&[Address]>,
        topics: Option<&[H256]>,
        from_block: Option<u64>,
        to_block: Option<u64>,
    ) -> bool {
        // Check address filter
        if let Some(addresses) = addresses {
            if !addresses.contains(&event.contract_address) {
                return false;
            }
        }

        // Check topic filter
        if let Some(topics) = topics {
            if !topics.contains(&event.signature) {
                return false;
            }
        }

        // Check block range
        if let Some(from_block) = from_block {
            if event.block_number < from_block {
                return false;
            }
        }

        if let Some(to_block) = to_block {
            if event.block_number > to_block {
                return false;
            }
        }

        true
    }

    /// Convert log to JSON string
    pub fn log_to_json(log: &Log) -> Result<String> {
        serde_json::to_string_pretty(log)
            .map_err(|e| SDKError::SerializationError(format!("Failed to serialize log: {}", e)))
    }

    /// Parse JSON to log
    pub fn json_to_log(json: &str) -> Result<Log> {
        serde_json::from_str(json)
            .map_err(|e| SDKError::SerializationError(format!("Failed to parse log JSON: {}", e)))
    }

    /// Create bloom filter for topics
    pub fn create_bloom_filter(topics: &[H256]) -> Bloom {
        let mut bloom = Bloom::default();
        for topic in topics {
            bloom.accrue(BloomInput::Raw(topic.as_ref()));
        }
        bloom
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_event_filter_builder() {
        let address = "0x1234567890123456789012345678901234567890"
            .parse()
            .unwrap();
        let topic = H256::random();

        let filter = EventFilterBuilder::new()
            .add_address(address)
            .add_topic(topic)
            .from_block(BlockNumber::Number(100))
            .to_block(BlockNumber::Number(200))
            .build();

        // The filter should have the address and topic set
        assert!(filter.address.is_some());
        assert!(filter.topic0.is_some());
    }

    #[test]
    fn test_calculate_event_signature() {
        let signature = utils::calculate_event_signature(
            "Transfer",
            &[("indexed_from", "address"), ("indexed_to", "address"), ("value", "uint256")]
        );

        // Signature should be 32 bytes
        assert_eq!(signature.as_ref().len(), 32);
    }

    #[test]
    fn test_event_filter_matching() {
        let event = ProcessedEvent {
            signature: H256::random(),
            name: None,
            contract_address: "0x1234567890123456789012345678901234567890"
                .parse()
                .unwrap(),
            block_number: 150,
            block_hash: H256::random(),
            transaction_hash: H256::random(),
            transaction_index: 0,
            log_index: 0,
            topics: vec![],
            data: vec![],
            parameters: None,
            processed_at: 1234567890,
        };

        // Test address filter
        let addresses = vec![event.contract_address];
        assert!(utils::event_matches_filter(&event, Some(&addresses), None, None, None));

        // Test block range filter
        assert!(utils::event_matches_filter(&event, None, None, Some(100), Some(200)));
        assert!(!utils::event_matches_filter(&event, None, None, Some(200), Some(300)));

        // Test topic filter
        let topics = vec![event.signature];
        assert!(utils::event_matches_filter(&event, None, Some(&topics), None, None));
    }

    #[test]
    fn test_function_event_handler() {
        let called = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
        let called_clone = called.clone();

        let handler = FunctionEventHandler::new(move |_event: &ProcessedEvent| {
            called_clone.store(true, std::sync::atomic::Ordering::Relaxed);
        });

        // Create a test event
        let event = ProcessedEvent {
            signature: H256::random(),
            name: None,
            contract_address: Address::zero(),
            block_number: 0,
            block_hash: H256::zero(),
            transaction_hash: H256::zero(),
            transaction_index: 0,
            log_index: 0,
            topics: vec![],
            data: vec![],
            parameters: None,
            processed_at: 0,
        };

        // Call the handler
        tokio::spawn(async move {
            handler.handle_event(&event).await;
        });

        // Note: In a real test, you'd wait for the async call to complete
        // This is just a basic test structure
    }

    #[tokio::test]
    async fn test_event_cache() {
        let cache = EventCache::new();

        let event = ProcessedEvent {
            signature: H256::random(),
            name: None,
            contract_address: Address::zero(),
            block_number: 100,
            block_hash: H256::zero(),
            transaction_hash: H256::zero(),
            transaction_index: 0,
            log_index: 0,
            topics: vec![],
            data: vec![],
            parameters: None,
            processed_at: 0,
        };

        // Add event
        cache.add_event(event.clone()).await;

        // Get events by block
        let block_events = cache.get_events_by_block(100).await;
        assert_eq!(block_events.len(), 1);
        assert_eq!(block_events[0].block_number, 100);

        // Get events by address
        let address_events = cache.get_events_by_address(event.contract_address).await;
        assert_eq!(address_events.len(), 1);
    }
}