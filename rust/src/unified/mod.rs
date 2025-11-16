//! Unified API for the Selendra SDK
//!
//! This module provides a single interface that can work with both Substrate and EVM chains
//! within the Selendra ecosystem, abstracting away the differences.

pub mod client;
pub mod account;
pub mod transaction;
pub mod balance;
pub mod contract;

pub use client::*;
pub use account::*;
pub use transaction::*;
pub use balance::*;
pub use contract::*;