//! Enhanced Connection Management
//!
//! This module provides unified connection handling for both Substrate and EVM chains,
//! building on the existing selendra_client with enhanced EVM support.

use crate::types::{Result, SDKError};
use crate::evm::{EVMClient, EVMConfig};
use crate::substrate::{Connection as SubstrateConnection, SignedConnection as SubstrateSignedConnection};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use ethers_core::types::{Address, U256, H256};

/// Connection type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConnectionType {
    Substrate,
    EVM,
    Both,
}

/// Connection status
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConnectionStatus {
    Disconnected,
    Connecting,
    Connected,
    Reconnecting,
    Error(String),
}

/// Unified connection configuration
#[derive(Debug, Clone)]
pub struct ConnectionConfig {
    /// Connection type
    pub connection_type: ConnectionType,
    /// Substrate endpoint (if applicable)
    pub substrate_endpoint: Option<String>,
    /// EVM endpoint (if applicable)
    pub evm_endpoint: Option<String>,
    /// Connection timeout in seconds
    pub timeout: u64,
    /// Maximum retry attempts
    pub max_retries: u32,
    /// Enable auto-reconnection
    pub auto_reconnect: bool,
    /// Health check interval in seconds
    pub health_check_interval: u64,
}

impl Default for ConnectionConfig {
    fn default() -> Self {
        Self {
            connection_type: ConnectionType::Both,
            substrate_endpoint: Some(crate::DEFAULT_SELENDRA_ENDPOINT.to_string()),
            evm_endpoint: Some(crate::DEFAULT_SELENDRA_EVM_ENDPOINT.to_string()),
            timeout: 30,
            max_retries: 3,
            auto_reconnect: true,
            health_check_interval: 60,
        }
    }
}

/// Enhanced connection manager that handles both Substrate and EVM connections
#[derive(Clone)]
pub struct ConnectionManager {
    config: ConnectionConfig,
    substrate_connection: Arc<RwLock<Option<SubstrateConnection>>>,
    evm_client: Arc<RwLock<Option<EVMClient>>>,
    status: Arc<RwLock<ConnectionStatus>>,
    substrate_status: Arc<RwLock<ConnectionStatus>>,
    evm_status: Arc<RwLock<ConnectionStatus>>,
}

impl ConnectionManager {
    /// Create a new connection manager
    pub fn new(config: ConnectionConfig) -> Self {
        Self {
            config,
            substrate_connection: Arc::new(RwLock::new(None)),
            evm_client: Arc::new(RwLock::new(None)),
            status: Arc::new(RwLock::new(ConnectionStatus::Disconnected)),
            substrate_status: Arc::new(RwLock::new(ConnectionStatus::Disconnected)),
            evm_status: Arc::new(RwLock::new(ConnectionStatus::Disconnected)),
        }
    }

    /// Initialize all configured connections
    pub async fn initialize(&self) -> Result<()> {
        *self.status.write().await = ConnectionStatus::Connecting;

        // Initialize Substrate connection if configured
        if matches!(self.config.connection_type, ConnectionType::Substrate | ConnectionType::Both) {
            if let Some(endpoint) = &self.config.substrate_endpoint {
                *self.substrate_status.write().await = ConnectionStatus::Connecting;
                match self.initialize_substrate(endpoint).await {
                    Ok(conn) => {
                        *self.substrate_connection.write().await = Some(conn);
                        *self.substrate_status.write().await = ConnectionStatus::Connected;
                        log::info!("Substrate connection established: {}", endpoint);
                    }
                    Err(e) => {
                        *self.substrate_status.write().await =
                            ConnectionStatus::Error(e.to_string());
                        log::error!("Failed to establish Substrate connection: {}", e);
                        if matches!(self.config.connection_type, ConnectionType::Substrate) {
                            *self.status.write().await = ConnectionStatus::Error(e.to_string());
                            return Err(e);
                        }
                    }
                }
            }
        }

        // Initialize EVM connection if configured
        if matches!(self.config.connection_type, ConnectionType::EVM | ConnectionType::Both) {
            if let Some(endpoint) = &self.config.evm_endpoint {
                *self.evm_status.write().await = ConnectionStatus::Connecting;
                match self.initialize_evm(endpoint).await {
                    Ok(client) => {
                        *self.evm_client.write().await = Some(client);
                        *self.evm_status.write().await = ConnectionStatus::Connected;
                        log::info!("EVM connection established: {}", endpoint);
                    }
                    Err(e) => {
                        *self.evm_status.write().await =
                            ConnectionStatus::Error(e.to_string());
                        log::error!("Failed to establish EVM connection: {}", e);
                        if matches!(self.config.connection_type, ConnectionType::EVM) {
                            *self.status.write().await = ConnectionStatus::Error(e.to_string());
                            return Err(e);
                        }
                    }
                }
            }
        }

        // Set overall status based on individual connections
        self.update_overall_status().await;

        Ok(())
    }

    /// Get Substrate connection
    pub async fn substrate(&self) -> Option<SubstrateConnection> {
        self.substrate_connection.read().await.clone()
    }

    /// Get EVM client
    pub async fn evm(&self) -> Option<EVMClient> {
        self.evm_client.read().await.clone()
    }

    /// Get connection status
    pub async fn status(&self) -> ConnectionStatus {
        self.status.read().await.clone()
    }

    /// Get Substrate connection status
    pub async fn substrate_status(&self) -> ConnectionStatus {
        self.substrate_status.read().await.clone()
    }

    /// Get EVM connection status
    pub async fn evm_status(&self) -> ConnectionStatus {
        self.evm_status.read().await.clone()
    }

    /// Check if all connections are healthy
    pub async fn is_healthy(&self) -> bool {
        let substrate_healthy = match self.config.connection_type {
            ConnectionType::Substrate => self.substrate_status.read().await == &ConnectionStatus::Connected,
            ConnectionType::EVM => true,
            ConnectionType::Both => self.substrate_status.read().await == &ConnectionStatus::Connected,
        };

        let evm_healthy = match self.config.connection_type {
            ConnectionType::EVM => self.evm_status.read().await == &ConnectionStatus::Connected,
            ConnectionType::Substrate => true,
            ConnectionType::Both => self.evm_status.read().await == &ConnectionStatus::Connected,
        };

        substrate_healthy && evm_healthy
    }

    /// Perform health check on all connections
    pub async fn health_check(&self) -> Result<HealthStatus> {
        let mut substrate_healthy = true;
        let mut evm_healthy = true;
        let mut substrate_latency_ms = None;
        let mut evm_latency_ms = None;
        let mut substrate_error = None;
        let mut evm_error = None;

        // Check Substrate connection
        if matches!(self.config.connection_type, ConnectionType::Substrate | ConnectionType::Both) {
            if let Some(conn) = self.substrate().await {
                let start = std::time::Instant::now();
                match conn.chain_info().await {
                    Ok(_) => {
                        substrate_latency_ms = Some(start.elapsed().as_millis() as u64);
                    }
                    Err(e) => {
                        substrate_healthy = false;
                        substrate_error = Some(e.to_string());
                    }
                }
            } else {
                substrate_healthy = false;
                substrate_error = Some("No Substrate connection".to_string());
            }
        }

        // Check EVM connection
        if matches!(self.config.connection_type, ConnectionType::EVM | ConnectionType::Both) {
            if let Some(client) = self.evm().await {
                let start = std::time::Instant::now();
                match client.get_chain_id().await {
                    Ok(_) => {
                        evm_latency_ms = Some(start.elapsed().as_millis() as u64);
                    }
                    Err(e) => {
                        evm_healthy = false;
                        evm_error = Some(e.to_string());
                    }
                }
            } else {
                evm_healthy = false;
                evm_error = Some("No EVM connection".to_string());
            }
        }

        Ok(HealthStatus {
            overall_healthy: substrate_healthy && evm_healthy,
            substrate_healthy,
            evm_healthy,
            substrate_latency_ms,
            evm_latency_ms,
            substrate_error,
            evm_error,
        })
    }

    /// Start automatic health monitoring
    pub async fn start_health_monitoring(&self) -> Result<HealthMonitor> {
        let health_monitor = HealthMonitor::new(self.clone());
        health_monitor.start().await?;
        Ok(health_monitor)
    }

    /// Disconnect all connections
    pub async fn disconnect(&self) -> Result<()> {
        *self.status.write().await = ConnectionStatus::Disconnected;
        *self.substrate_connection.write().await = None;
        *self.evm_client.write().await = None;
        *self.substrate_status.write().await = ConnectionStatus::Disconnected;
        *self.evm_status.write().await = ConnectionStatus::Disconnected;
        Ok(())
    }

    /// Reconnect all connections
    pub async fn reconnect(&self) -> Result<()> {
        self.disconnect().await?;
        self.initialize().await
    }

    // Private methods

    /// Initialize Substrate connection
    async fn initialize_substrate(&self, endpoint: &str) -> Result<SubstrateConnection> {
        SubstrateConnection::new(endpoint)
            .await
            .map_err(|e| SDKError::ConnectionError(format!("Failed to connect to Substrate: {}", e)))
    }

    /// Initialize EVM connection
    async fn initialize_evm(&self, endpoint: &str) -> Result<EVMClient> {
        let evm_config = EVMConfig::new(endpoint)
            .timeout(self.config.timeout)
            .max_retries(self.config.max_retries);

        EVMClient::new(evm_config)
            .await
            .map_err(|e| SDKError::ConnectionError(format!("Failed to connect to EVM: {}", e)))
    }

    /// Update overall connection status based on individual connections
    async fn update_overall_status(&self) {
        let substrate_status = self.substrate_status.read().await.clone();
        let evm_status = self.evm_status.read().await.clone();

        let overall_status = match (substrate_status, evm_status) {
            (ConnectionStatus::Connected, ConnectionStatus::Connected) => ConnectionStatus::Connected,
            (ConnectionStatus::Error(e1), ConnectionStatus::Error(e2)) =>
                ConnectionStatus::Error(format!("Both connections failed: {} | {}", e1, e2)),
            (ConnectionStatus::Error(e), _) | (_, ConnectionStatus::Error(e)) =>
                ConnectionStatus::Error(format!("One connection failed: {}", e)),
            (ConnectionStatus::Connecting, ConnectionStatus::Connected) |
            (ConnectionStatus::Connected, ConnectionStatus::Connecting) =>
                ConnectionStatus::Connecting,
            (ConnectionStatus::Reconnecting, ConnectionStatus::Connected) |
            (ConnectionStatus::Connected, ConnectionStatus::Reconnecting) =>
                ConnectionStatus::Reconnecting,
            (ConnectionStatus::Disconnected, ConnectionStatus::Connected) |
            (ConnectionStatus::Connected, ConnectionStatus::Disconnected) =>
                ConnectionStatus::Connected, // Partial connection is still useful
            _ => ConnectionStatus::Disconnected,
        };

        *self.status.write().await = overall_status;
    }
}

/// Health status information
#[derive(Debug, Clone)]
pub struct HealthStatus {
    /// Overall health status
    pub overall_healthy: bool,
    /// Substrate connection health
    pub substrate_healthy: bool,
    /// EVM connection health
    pub evm_healthy: bool,
    /// Substrate connection latency in milliseconds
    pub substrate_latency_ms: Option<u64>,
    /// EVM connection latency in milliseconds
    pub evm_latency_ms: Option<u64>,
    /// Substrate connection error (if any)
    pub substrate_error: Option<String>,
    /// EVM connection error (if any)
    pub evm_error: Option<String>,
}

/// Health monitor for automatic health checking
pub struct HealthMonitor {
    connection_manager: ConnectionManager,
    running: Arc<RwLock<bool>>,
}

impl HealthMonitor {
    /// Create a new health monitor
    pub fn new(connection_manager: ConnectionManager) -> Self {
        Self {
            connection_manager,
            running: Arc::new(RwLock::new(false)),
        }
    }

    /// Start health monitoring
    pub async fn start(&self) -> Result<()> {
        let mut running = self.running.write().await;
        if *running {
            return Err(SDKError::AlreadyRunning("Health monitor is already running".to_string()));
        }
        *running = true;

        let connection_manager = self.connection_manager.clone();
        let running_flag = self.running.clone();
        let interval = Duration::from_secs(connection_manager.config.health_check_interval);

        tokio::spawn(async move {
            while *running_flag.read().await {
                if let Ok(health) = connection_manager.health_check().await {
                    if !health.overall_healthy {
                        log::warn!("Connection health check failed: {:?}", health);

                        // Attempt reconnection if configured
                        if connection_manager.config.auto_reconnect {
                            log::info!("Attempting to reconnect...");
                            if let Err(e) = connection_manager.reconnect().await {
                                log::error!("Failed to reconnect: {}", e);
                            }
                        }
                    } else {
                        log::debug!("Health check passed. Latencies: Substrate: {:?}ms, EVM: {:?}ms",
                            health.substrate_latency_ms, health.evm_latency_ms);
                    }
                }

                tokio::time::sleep(interval).await;
            }
        });

        Ok(())
    }

    /// Stop health monitoring
    pub async fn stop(&self) {
        *self.running.write().await = false;
    }

    /// Check if monitoring is running
    pub async fn is_running(&self) -> bool {
        *self.running.read().await
    }
}

/// Connection pool for managing multiple connections
pub struct ConnectionPool {
    connections: Arc<RwLock<Vec<ConnectionManager>>>,
    config: ConnectionConfig,
}

impl ConnectionPool {
    /// Create a new connection pool
    pub fn new(config: ConnectionConfig) -> Self {
        Self {
            connections: Arc::new(RwLock::new(Vec::new())),
            config,
        }
    }

    /// Add a connection to the pool
    pub async fn add_connection(&self, config: ConnectionConfig) -> Result<()> {
        let manager = ConnectionManager::new(config);
        manager.initialize().await?;
        self.connections.write().await.push(manager);
        Ok(())
    }

    /// Get a healthy connection from the pool
    pub async fn get_healthy_connection(&self) -> Option<ConnectionManager> {
        let connections = self.connections.read().await;
        for manager in connections.iter() {
            if manager.is_healthy().await {
                return Some(manager.clone());
            }
        }
        None
    }

    /// Get all connections from the pool
    pub async fn get_all_connections(&self) -> Vec<ConnectionManager> {
        self.connections.read().await.clone()
    }

    /// Remove all connections
    pub async fn clear(&self) -> Result<()> {
        let connections = self.connections.read().await;
        for manager in connections.iter() {
            manager.disconnect().await?;
        }
        self.connections.write().await.clear();
        Ok(())
    }
}

/// Connection utilities
pub mod utils {
    use super::*;

    /// Validate endpoint URL
    pub fn validate_endpoint(endpoint: &str) -> Result<()> {
        let url = url::Url::parse(endpoint)
            .map_err(|e| SDKError::InvalidEndpoint(format!("Invalid URL: {}", e)))?;

        // Check scheme
        match url.scheme() {
            "ws" | "wss" | "http" | "https" => Ok(()),
            _ => Err(SDKError::InvalidEndpoint(
                format!("Unsupported URL scheme: {}", url.scheme())
            )),
        }
    }

    /// Determine connection type from endpoint
    pub fn determine_connection_type(endpoint: &str) -> ConnectionType {
        if endpoint.starts_with("ws://") || endpoint.starts_with("wss://") {
            ConnectionType::Substrate
        } else if endpoint.starts_with("http://") || endpoint.starts_with("https://") {
            ConnectionType::EVM
        } else {
            // Default to EVM for unknown schemes
            ConnectionType::EVM
        }
    }

    /// Get default configuration for chain type
    pub fn default_config_for_chain(chain_type: ConnectionType) -> ConnectionConfig {
        match chain_type {
            ConnectionType::Substrate => ConnectionConfig {
                connection_type: ConnectionType::Substrate,
                substrate_endpoint: Some(crate::DEFAULT_SELENDRA_ENDPOINT.to_string()),
                evm_endpoint: None,
                ..Default::default()
            },
            ConnectionType::EVM => ConnectionConfig {
                connection_type: ConnectionType::EVM,
                substrate_endpoint: None,
                evm_endpoint: Some(crate::DEFAULT_SELENDRA_EVM_ENDPOINT.to_string()),
                ..Default::default()
            },
            ConnectionType::Both => ConnectionConfig::default(),
        }
    }

    /// Test connection latency
    pub async fn test_connection_latency(endpoint: &str) -> Result<u64> {
        let start = std::time::Instant::now();

        if endpoint.starts_with("ws://") || endpoint.starts_with("wss://") {
            // Test Substrate connection
            let _conn = SubstrateConnection::new(endpoint).await?;
        } else {
            // Test EVM connection
            let config = EVMConfig::new(endpoint);
            let _client = EVMClient::new(config).await?;
        }

        Ok(start.elapsed().as_millis() as u64)
    }

    /// Compare multiple endpoints and return the fastest
    pub async fn find_fastest_endpoint(endpoints: &[String]) -> Result<String> {
        if endpoints.is_empty() {
            return Err(SDKError::InvalidEndpoint("No endpoints provided".to_string()));
        }

        let mut best_endpoint = None;
        let mut best_latency = u64::MAX;

        for endpoint in endpoints {
            match test_connection_latency(endpoint).await {
                Ok(latency) => {
                    if latency < best_latency {
                        best_latency = latency;
                        best_endpoint = Some(endpoint.clone());
                    }
                }
                Err(e) => {
                    log::warn!("Failed to connect to {}: {}", endpoint, e);
                }
            }
        }

        best_endpoint.ok_or_else(|| SDKError::ConnectionError("No endpoints responded".to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_connection_config_default() {
        let config = ConnectionConfig::default();
        assert_eq!(config.connection_type, ConnectionType::Both);
        assert!(config.substrate_endpoint.is_some());
        assert!(config.evm_endpoint.is_some());
        assert!(config.auto_reconnect);
    }

    #[test]
    fn test_validate_endpoint() {
        assert!(utils::validate_endpoint("ws://localhost:9944").is_ok());
        assert!(utils::validate_endpoint("https://example.com").is_ok());
        assert!(utils::validate_endpoint("ftp://example.com").is_err());
        assert!(utils::validate_endpoint("invalid-url").is_err());
    }

    #[test]
    fn test_determine_connection_type() {
        assert_eq!(utils::determine_connection_type("ws://localhost:9944"), ConnectionType::Substrate);
        assert_eq!(utils::determine_connection_type("wss://example.com"), ConnectionType::Substrate);
        assert_eq!(utils::determine_connection_type("http://localhost:8545"), ConnectionType::EVM);
        assert_eq!(utils::determine_connection_type("https://example.com"), ConnectionType::EVM);
    }

    #[test]
    fn test_default_config_for_chain() {
        let substrate_config = utils::default_config_for_chain(ConnectionType::Substrate);
        assert_eq!(substrate_config.connection_type, ConnectionType::Substrate);
        assert!(substrate_config.substrate_endpoint.is_some());
        assert!(substrate_config.evm_endpoint.is_none());

        let evm_config = utils::default_config_for_chain(ConnectionType::EVM);
        assert_eq!(evm_config.connection_type, ConnectionType::EVM);
        assert!(evm_config.substrate_endpoint.is_none());
        assert!(evm_config.evm_endpoint.is_some());
    }

    #[tokio::test]
    async fn test_connection_manager_creation() {
        let config = ConnectionConfig::default();
        let manager = ConnectionManager::new(config);
        assert_eq!(manager.status().await, ConnectionStatus::Disconnected);
    }

    #[tokio::test]
    async fn test_health_monitor_creation() {
        let config = ConnectionConfig::default();
        let manager = ConnectionManager::new(config);
        let monitor = HealthMonitor::new(manager);
        assert!(!monitor.is_running().await);
    }

    #[tokio::test]
    async fn test_connection_pool() {
        let config = ConnectionConfig::default();
        let pool = ConnectionPool::new(config);
        let connections = pool.get_all_connections().await;
        assert!(connections.is_empty());
    }
}