//! Retry utilities for network operations

use std::time::Duration;
use tokio::time::sleep;

/// Retry configuration for network operations
#[derive(Debug, Clone)]
pub struct NetworkRetryConfig {
    /// Maximum number of retry attempts
    pub max_attempts: u32,
    /// Initial delay between retries
    pub initial_delay: Duration,
    /// Backoff multiplier (e.g., 2.0 for exponential backoff)
    pub backoff_multiplier: f64,
    /// Maximum delay between retries
    pub max_delay: Duration,
}

impl Default for NetworkRetryConfig {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            initial_delay: Duration::from_millis(1000),
            backoff_multiplier: 2.0,
            max_delay: Duration::from_secs(30),
        }
    }
}

impl NetworkRetryConfig {
    /// Create a new retry config
    pub fn new(max_attempts: u32, initial_delay: Duration) -> Self {
        Self {
            max_attempts,
            initial_delay,
            backoff_multiplier: 2.0,
            max_delay: Duration::from_secs(30),
        }
    }

    /// Set backoff multiplier
    pub fn backoff_multiplier(mut self, multiplier: f64) -> Self {
        self.backoff_multiplier = multiplier;
        self
    }

    /// Set maximum delay
    pub fn max_delay(mut self, delay: Duration) -> Self {
        self.max_delay = delay;
        self
    }
}

/// Retry a function with the given configuration
pub async fn retry_with_config<F, T, E>(
    config: NetworkRetryConfig,
    mut f: F,
) -> Result<T, E>
where
    F: FnMut() -> Result<T, E>,
    E: std::fmt::Debug,
{
    let mut delay = config.initial_delay;
    let mut last_error = None;

    for attempt in 1..=config.max_attempts {
        match f() {
            Ok(result) => return Ok(result),
            Err(error) => {
                last_error = Some(error);

                if attempt < config.max_attempts {
                    sleep(delay).await;
                    delay = std::cmp::min(
                        Duration::from_millis(
                            (delay.as_millis() as f64 * config.backoff_multiplier) as u64
                        ),
                        config.max_delay,
                    );
                }
            }
        }
    }

    Err(last_error.unwrap())
}

/// Retry an async function with the given configuration
pub async fn retry_async_with_config<F, Fut, T, E>(
    config: NetworkRetryConfig,
    mut f: F,
) -> Result<T, E>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, E>>,
    E: std::fmt::Debug,
{
    let mut delay = config.initial_delay;
    let mut last_error = None;

    for attempt in 1..=config.max_attempts {
        match f().await {
            Ok(result) => return Ok(result),
            Err(error) => {
                last_error = Some(error);

                if attempt < config.max_attempts {
                    sleep(delay).await;
                    delay = std::cmp::min(
                        Duration::from_millis(
                            (delay.as_millis() as f64 * config.backoff_multiplier) as u64
                        ),
                        config.max_delay,
                    );
                }
            }
        }
    }

    Err(last_error.unwrap())
}