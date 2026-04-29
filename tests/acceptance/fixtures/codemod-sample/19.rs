pub fn truthy(x: i32) -> bool {
    x != 0
}

pub fn falsy(x: i32) -> bool {
    !truthy(x)
}

pub fn xor(a: bool, b: bool) -> bool {
    a != b
}
