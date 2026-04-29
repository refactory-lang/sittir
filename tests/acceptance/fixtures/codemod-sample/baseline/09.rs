#[inline]
pub fn sum(xs: &[i32]) -> i32 {
    xs.iter().sum()
}

#[inline]
pub fn product(xs: &[i32]) -> i32 {
    xs.iter().product()
}

pub fn mean(xs: &[i32]) -> Option<f64> {
    if xs.is_empty() {
        return None;
    }
    Some(sum(xs) as f64 / xs.len() as f64)
}
