//! A list that holds at least one item: the storage of a `repeat1` slot,
//! whose emptiness is refused where the list is made rather than where it is
//! read.

use std::ops::{Deref, DerefMut};

/// A list that holds at least one item: a `repeat1` slot's storage.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NonEmptyVec<T>(Vec<T>);

/// The refusal of an empty list where a `repeat1` slot's storage is made.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EmptyList;

impl<T> TryFrom<Vec<T>> for NonEmptyVec<T> {
    type Error = EmptyList;
    fn try_from(items: Vec<T>) -> Result<Self, EmptyList> {
        if items.is_empty() { Err(EmptyList) } else { Ok(Self(items)) }
    }
}

impl<T> NonEmptyVec<T> {
    /// The items as a plain list.
    pub fn into_vec(self) -> Vec<T> {
        self.0
    }
}

impl<T> Deref for NonEmptyVec<T> {
    type Target = [T];
    fn deref(&self) -> &[T] {
        &self.0
    }
}

impl<T> DerefMut for NonEmptyVec<T> {
    fn deref_mut(&mut self) -> &mut [T] {
        &mut self.0
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue> ::napi::bindgen_prelude::FromNapiValue for NonEmptyVec<T> {
    /// `Vec`'s decode, refusing an empty array.
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        let items = unsafe { Vec::<T>::from_napi_value(env, napi_val)? };
        Self::try_from(items).map_err(|EmptyList| ::napi::Error::from_reason("a repeat1 list holds no item"))
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for NonEmptyVec<T> {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        unsafe { Vec::<T>::to_napi_value(env, val.0) }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_empty_list_is_not_a_non_empty_vec() {
        assert!(NonEmptyVec::<u8>::try_from(Vec::new()).is_err());
        let one = NonEmptyVec::try_from(vec![1u8]).unwrap();
        assert_eq!(&*one, &[1u8]);
    }
}
