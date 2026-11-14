//! What a sink that keeps `RenderSink`'s default methods gets from them.

use sittir_core::layout_kinds::LayoutKinds;
use sittir_core::options::{EdgeArm, Side};
use sittir_core::render::{JoinArm, RenderResult, RenderSink};
use sittir_core::types::{KindId, SiteId};

#[derive(Default)]
struct Recorder {
    pending: JoinArm,
    writes: Vec<(String, JoinArm)>,
}

impl RenderSink for Recorder {
    fn text(&mut self, s: &str) -> RenderResult {
        if !s.is_empty() {
            let arm = std::mem::take(&mut self.pending);
            self.writes.push((s.to_owned(), arm));
        }
        Ok(())
    }
    fn join_arm(&mut self, arm: JoinArm) {
        self.pending = self.pending.or(arm);
    }
    fn site(&mut self, _: KindId) {}
    fn site_at(&mut self, _: SiteId) {}
    fn edge(&mut self, _: KindId, _: Side, _: Option<EdgeArm>) {}
    fn seam(&mut self, _: LayoutKinds) {}
    fn indent(&mut self) {}
    fn dedent(&mut self, _: LayoutKinds) {}
    fn ends_line(&self) -> bool {
        false
    }
    fn defer_trailing(&mut self, render: &mut dyn FnMut(&mut dyn RenderSink) -> RenderResult) -> RenderResult {
        render(self)
    }
    fn seat_trailing(&mut self) -> RenderResult {
        Ok(())
    }
}

#[test]
fn a_verbatim_write_arms_its_last_token_to_join_what_follows() {
    let mut sink = Recorder::default();
    sink.verbatim(Some(" "), "a+", Some(""), None).unwrap();
    assert_eq!(sink.writes, vec![(" a+".to_owned(), JoinArm::NEXT)]);
}

#[test]
fn an_empty_verbatim_write_leaves_no_arm_for_the_write_after_it() {
    let mut sink = Recorder::default();
    sink.verbatim(None, "", None, None).unwrap();
    sink.text("+").unwrap();
    assert_eq!(sink.writes, vec![("+".to_owned(), JoinArm::NONE)]);
}
