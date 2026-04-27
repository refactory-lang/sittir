# JS Backend Rename Design

## Problem

The non-native backend is currently named `typescript`, which is easy to confuse with the TypeScript grammar and package surfaces. The name should describe the backend implementation, not collide with grammar terminology.

## Decision

Rename the non-native backend identity from `typescript` to `js` everywhere backend naming appears.

## Scope

This rename applies wherever the system is describing or selecting a backend that is **not native**, including:

- backend type names and status values
- `SITTIR_BACKEND` forced-selection values
- debug output and error text
- baseline JSON backend metadata
- tests and docs that refer to backend names

This rename does **not** apply to grammar names, package names, or other TypeScript-language concepts.

## Compatibility

This is a **hard rename**:

- `SITTIR_BACKEND=js` is the supported non-native selector
- `SITTIR_BACKEND=typescript` is no longer accepted as an alias

## Non-Goals

- No backend behavior changes
- No renderer logic changes
- No grammar/package renames
- No fallback-policy changes

## Success Criteria

- Every backend surface uses `js | native` rather than `typescript | native`
- No backend-selection or reporting path still emits `typescript` for the non-native engine
- TypeScript grammar/package naming remains unchanged
