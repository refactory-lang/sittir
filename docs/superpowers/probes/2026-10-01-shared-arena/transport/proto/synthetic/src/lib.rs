#![allow(dead_code, unused_imports)]
#[path = "../../probe/src/rt.rs"]
pub mod rt;
use rt::{Coord, Slot};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use slot_derive::transport;
include!("kinds.rs");
