#[inline]
pub fn min(a: f64, b: f64) -> f64 {
    if a < b { a } else { b }
}

#[inline]
pub fn max(a: f64, b: f64) -> f64 {
    if a > b { a } else { b }
}

#[inline]
pub fn clamp(v: f64, lo: f64, hi: f64) -> f64 {
    max(lo, min(hi, v))
}
