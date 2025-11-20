//! Substrate client implementation for the Selendra SDK
//!
//! Client for interacting with Substrate-based chains.

pub mod client;
pub mod types;
pub mod account;
pub mod events;
pub mod contracts;

pub use client::*;
pub use types::*;
pub use account::*;
pub use events::*;
pub use contracts::*;

// Task 1.6: REMOVED redundant placeholder files:
// - storage.rs (all methods returned Ok(None))
// - extrinsics.rs (all methods returned random hashes)
// - metadata.rs (placeholder implementation)
// These are now handled by selendra_client wrapper in client.rs
