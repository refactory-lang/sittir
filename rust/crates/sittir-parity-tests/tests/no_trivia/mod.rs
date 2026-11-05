//! The trivia type of the nodes a test declares: a layout run, the one
//! trivia a read builds as a node, carries nothing and renders nothing; it
//! never crosses the boundary.

#[derive(Debug, Clone, PartialEq)]
pub struct NoTrivia;

impl sittir_core::render::Render for NoTrivia {
    fn render(&self, _: &mut dyn sittir_core::render::RenderSink) -> sittir_core::render::RenderResult {
        Ok(())
    }
}

impl sittir_core::trivia::TriviaSeam for NoTrivia {}

impl sittir_core::heap::HeapBytes for NoTrivia {
    fn heap_bytes(&self) -> usize {
        0
    }
}

impl sittir_core::prepare::Prepare for NoTrivia {
    fn prepare(&mut self, _: &sittir_core::prepare::RenderContext<'_>) -> Result<(), sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl sittir_core::trivia::FromTriviaText for NoTrivia {
    fn from_text(_: sittir_core::trivia::TriviaText) -> Self {
        NoTrivia
    }

    fn from_layout(_: sittir_core::trivia::TriviaText) -> Option<Self> {
        Some(NoTrivia)
    }
}

sittir_core::refuse_napi_codec!(NoTrivia);
