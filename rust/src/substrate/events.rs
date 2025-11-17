//! Event handling for Substrate chains

use crate::types::{Result, SDKError};
use sp_core::H256;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Event manager
pub struct EventManager {
    filters: HashMap<String, EventFilter>,
}

impl EventManager {
    /// Create a new event manager
    pub fn new() -> Self {
        Self {
            filters: HashMap::new(),
        }
    }

    /// Add an event filter
    pub fn add_filter(&mut self, name: String, filter: EventFilter) {
        self.filters.insert(name, filter);
    }

    /// Remove an event filter
    pub fn remove_filter(&mut self, name: &str) -> Option<EventFilter> {
        self.filters.remove(name)
    }

    /// Get all filters
    pub fn get_filters(&self) -> &HashMap<String, EventFilter> {
        &self.filters
    }
}

/// Event filter
#[derive(Debug, Clone)]
pub struct EventFilter {
    /// Pallet name
    pub pallet: Option<String>,
    /// Event name
    pub event_name: Option<String>,
    /// Filter parameters
    pub parameters: HashMap<String, Vec<u8>>,
}

impl EventFilter {
    /// Create a new event filter
    pub fn new() -> Self {
        Self {
            pallet: None,
            event_name: None,
            parameters: HashMap::new(),
        }
    }

    /// Set pallet filter
    pub fn pallet(mut self, pallet: String) -> Self {
        self.pallet = Some(pallet);
        self
    }

    /// Set event name filter
    pub fn event_name(mut self, name: String) -> Self {
        self.event_name = Some(name);
        self
    }

    /// Add parameter filter
    pub fn parameter(mut self, key: String, value: Vec<u8>) -> Self {
        self.parameters.insert(key, value);
        self
    }
}

/// Raw event data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawEvent {
    /// Event pallet
    pub pallet: String,
    /// Event name
    pub name: String,
    /// Event data
    pub data: Vec<u8>,
    /// Phase information
    pub phase: EventPhase,
    /// Topics
    pub topics: Vec<H256>,
}

/// Event phase information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventPhase {
    /// Apply extrinsic
    ApplyExtrinsic(u32),
    /// Finalization
    Finalization,
    /// Initialization
    Initialization,
}

/// Event decoder
pub struct EventDecoder {
    pallets: HashMap<String, PalletMetadata>,
}

impl EventDecoder {
    /// Create a new event decoder
    pub fn new() -> Self {
        Self {
            pallets: HashMap::new(),
        }
    }

    /// Add pallet metadata
    pub fn add_pallet(&mut self, pallet: String, metadata: PalletMetadata) {
        self.pallets.insert(pallet, metadata);
    }

    /// Decode raw event
    pub fn decode(&self, raw: &RawEvent) -> Result<DecodedEvent> {
        let pallet_metadata = self.pallets.get(&raw.pallet)
            .ok_or_else(|| SDKError::Unknown(format!("Pallet '{}' not found", raw.pallet)))?;

        let event_metadata = pallet_metadata.events.get(&raw.name)
            .ok_or_else(|| SDKError::Unknown(format!("Event '{}' not found in pallet '{}'", raw.name, raw.pallet)))?;

        Ok(DecodedEvent {
            pallet: raw.pallet.clone(),
            name: raw.name.clone(),
            data: raw.data.clone(),
            phase: raw.phase.clone(),
            topics: raw.topics.clone(),
            event_type: event_metadata.event_type.clone(),
        })
    }
}

/// Pallet metadata
#[derive(Debug, Clone)]
pub struct PalletMetadata {
    pub events: HashMap<String, EventMetadata>,
}

/// Event metadata
#[derive(Debug, Clone)]
pub struct EventMetadata {
    pub event_type: String,
    pub fields: Vec<EventField>,
}

/// Event field
#[derive(Debug, Clone)]
pub struct EventField {
    pub name: String,
    pub field_type: String,
    pub indexed: bool,
}

/// Decoded event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecodedEvent {
    /// Event pallet
    pub pallet: String,
    /// Event name
    pub name: String,
    /// Event data
    pub data: Vec<u8>,
    /// Phase information
    pub phase: EventPhase,
    /// Topics
    pub topics: Vec<H256>,
    /// Event type
    pub event_type: String,
}

impl DecodedEvent {
    /// Create a new decoded event
    pub fn new(
        pallet: String,
        name: String,
        data: Vec<u8>,
        phase: EventPhase,
        topics: Vec<H256>,
        event_type: String,
    ) -> Self {
        Self {
            pallet,
            name,
            data,
            phase,
            topics,
            event_type,
        }
    }

    /// Get event identifier
    pub fn id(&self) -> String {
        format!("{}::{}", self.pallet, self.name)
    }

    /// Check if event matches filter
    pub fn matches(&self, filter: &EventFilter) -> bool {
        if let Some(ref pallet) = filter.pallet {
            if self.pallet != *pallet {
                return false;
            }
        }

        if let Some(ref event_name) = filter.event_name {
            if self.name != *event_name {
                return false;
            }
        }

        // Check parameter filters
        for (_key, _expected_value) in &filter.parameters {
            // This is a simplified check - in reality you'd need to decode the event data
            // and compare against the expected values
        }

        true
    }
}

/// Event listener
pub struct EventListener {
    manager: EventManager,
    decoder: EventDecoder,
}

impl EventListener {
    /// Create a new event listener
    pub fn new() -> Self {
        Self {
            manager: EventManager::new(),
            decoder: EventDecoder::new(),
        }
    }

    /// Add event filter
    pub fn add_filter(&mut self, name: String, filter: EventFilter) {
        self.manager.add_filter(name, filter);
    }

    /// Process raw event
    pub fn process_event(&self, raw: RawEvent) -> Result<Vec<DecodedEvent>> {
        let decoded = self.decoder.decode(&raw)?;

        let mut matched_events = Vec::new();
        for filter in self.manager.get_filters().values() {
            if decoded.matches(filter) {
                matched_events.push(decoded.clone());
            }
        }

        Ok(matched_events)
    }
}