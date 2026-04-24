#[inline]
pub fn safe_div(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 { None } else { Some(a / b) }
}

#[inline]
pub fn safe_mod(a: i32, b: i32) -> Option<i32> {
    if b == 0 { None } else { Some(a % b) }
}
