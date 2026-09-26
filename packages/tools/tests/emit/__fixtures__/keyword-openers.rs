fn f<T>(a: Vec<T>, b: &[Foo]) -> Option<(Foo, Foo)> {
    let x = (1, 2);
    let y = [1, 2, 3];
    if (a.len() > 1) {
        return (1, 2);
    }
    for (i, v) in (0..3) {
        let q = (i);
    }
    while (true) {
        break (1);
    }
    let z = a as (Foo);
    let m = vec![1, 2];
    let c = |p| (p);
    let t: (Foo, Foo) = (1, 2);
    let u = &(1);
    let v = -(1);
    let n = !(true);
    Some((1, 2))
}

pub(crate) fn g() {}

pub fn h() {}

pub(in crate::x) struct S;
