pub fn flatten<T: Clone>(nested: &[Vec<T>]) -> Vec<T> {
    let mut out = Vec::new();
    for chunk in nested {
        out.extend_from_slice(chunk);
    }
    out
}
