pub fn long_function(input: &[i32]) -> Vec<i32> {
    let mut out = Vec::with_capacity(input.len());
    for value in input {
        let mapped = value * 3 + 7;
        out.push(mapped);
    }
    out.sort();
    out
}

#[inline]
pub fn short_helper(x: i32) -> i32 {
    x + 1
}
