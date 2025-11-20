//! Logging utilities for the SDK

use log::{LevelFilter, SetLoggerError};
use std::collections::HashMap;

/// Logger configuration
#[derive(Debug, Clone)]
pub struct LoggerConfig {
    /// Minimum log level
    pub level: LevelFilter,
    /// Module-specific log levels
    pub module_levels: HashMap<String, LevelFilter>,
    /// Whether to include timestamps
    pub include_timestamp: bool,
    /// Whether to include module path
    pub include_module: bool,
    /// Whether to include target
    pub include_target: bool,
}

impl Default for LoggerConfig {
    fn default() -> Self {
        Self {
            level: LevelFilter::Info,
            module_levels: HashMap::new(),
            include_timestamp: true,
            include_module: true,
            include_target: false,
        }
    }
}

impl LoggerConfig {
    /// Create a new logger config
    pub fn new(level: LevelFilter) -> Self {
        Self {
            level,
            module_levels: HashMap::new(),
            include_timestamp: true,
            include_module: true,
            include_target: false,
        }
    }

    /// Set module-specific log level
    pub fn module_level(mut self, module: &str, level: LevelFilter) -> Self {
        self.module_levels.insert(module.to_string(), level);
        self
    }

    /// Set whether to include timestamps
    pub fn timestamp(mut self, include: bool) -> Self {
        self.include_timestamp = include;
        self
    }

    /// Set whether to include module path
    pub fn module_path(mut self, include: bool) -> Self {
        self.include_module = include;
        self
    }

    /// Set whether to include target
    pub fn target(mut self, include: bool) -> Self {
        self.include_target = include;
        self
    }
}

/// Initialize the logger with the given configuration
pub fn init_logger(config: LoggerConfig) -> Result<(), SetLoggerError> {
    // This is a simplified logger implementation
    // In a real implementation, you would use a proper logging crate like env_logger
    println!("Logger initialized with level: {:?}", config.level);
    Ok(())
}

/// Initialize default logger
pub fn init_default_logger() -> Result<(), SetLoggerError> {
    init_logger(LoggerConfig::default())
}

/// Initialize debug logger
pub fn init_debug_logger() -> Result<(), SetLoggerError> {
    init_logger(LoggerConfig::new(LevelFilter::Debug))
}

/// Initialize trace logger
pub fn init_trace_logger() -> Result<(), SetLoggerError> {
    init_logger(LoggerConfig::new(LevelFilter::Trace))
}