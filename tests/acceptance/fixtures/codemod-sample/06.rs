fn parse_pair(input: &str) -> Option<(i32, i32)> {
    let mut parts = input.split(',');
    let a = parts.next()?.parse().ok()?;
    let b = parts.next()?.parse().ok()?;
    if parts.next().is_some() {
        return None;
    }
    Some((a, b))
}
