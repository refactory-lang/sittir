//! The fields trait the derive emits for a struct codegen stamps with
//! `fields = …`: one accessor per field, through which a render body generic
//! over the trait renders a native node the way a body over its fields does.

use sittir_core::layout::BodyLayout;
use sittir_core::render::{render_to_string, Render, RenderResult, RenderSink, WhitespaceTable};
use sittir_core::spacing::WordMatcher;
use sittir_core::types::{ItemIndex, KindId};
use sittir_core::view::{KindOf, KindTest, ListView, Slot, View};
use sittir_core::{Node, SlotValue};
use sittir_rust::render::node::{NodeLayout, TriviaNode};
use sittir_rust::render::{field_ids as field, kind_ids as kind};

#[derive(Debug, Clone, PartialEq, Node)]
#[node(kind = kind::IDENTIFIER, text, fields = IdentFields)]
struct Ident {
    #[wire(key = "$_layout")]
    #[layout]
    layout: Option<Box<NodeLayout>>,
    #[wire(key = "$text")]
    #[text]
    text: String,
}

sittir_core::grammar_trivia!(TriviaNode; Ident, Function);

impl KindOf for Ident {
    fn kind_in(&self, kinds: &[KindId]) -> bool {
        kinds.contains(&kind::IDENTIFIER)
    }
}

impl Render for Ident {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        render_ident(self, w)
    }
}

#[derive(Debug, Clone, PartialEq, Node)]
#[node(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD], fields = FunctionFields)]
struct Function {
    #[wire(key = "$_layout")]
    #[layout]
    layout: Option<Box<NodeLayout>>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[wire(key = "_parameters")]
    #[slot(field = field::PARAMETERS)]
    parameters: Vec<SlotValue<Ident>>,
    #[wire(key = "_return_type")]
    #[slot(field = field::RETURN_TYPE)]
    return_type: Option<SlotValue<Ident>>,
    #[wire(key = "_separator")]
    #[separator_kind(candidates = [kind::COMMA, kind::SEMI])]
    separator: Option<KindId>,
}

fn render_ident<N: IdentFields + ?Sized>(node: &N, w: &mut dyn RenderSink) -> RenderResult {
    w.text(node.text())
}

fn render_function<N: FunctionFields + ?Sized>(node: &N, w: &mut dyn RenderSink) -> RenderResult {
    let name = node.name();
    let parameters = ListView {
        items: node.parameters(),
        template: "({})",
        before: KindId::BLANK,
        token: ",",
        separators: Some((node.layout().slot_tokens("_parameters"), |_| ";")),
        after: KindId::BLANK,
        leading: false,
        trailing: false,
        head: None,
        tail: None,
        units: node.layout().list_units("_parameters"),
    };
    let return_type = View::new(node.return_type(), "->{}");
    w.text("fn")?;
    node.layout().render_unit("_name", ItemIndex(0), w, |w| name.render(w))?;
    if parameters.is_present() || node.separator().is_some() {
        parameters.render(w)?;
    }
    if return_type.is_present() && return_type.kind_in(&*w, &[kind::IDENTIFIER]) {
        return_type.render(w)?;
    }
    Ok(())
}

impl Render for Function {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        render_function(self, w)
    }
}

fn ident(text: &str) -> SlotValue<Ident> {
    SlotValue::Node(Ident { layout: None, text: text.to_string() })
}

fn text_of(_: KindId) -> &'static str {
    ""
}

const TABLE: WhitespaceTable = WhitespaceTable { text_of, indent: KindId(0), dedent: KindId(0), leaf_edges: &[], gaps: &[] };

fn rendered(value: &dyn Render) -> String {
    render_to_string(value, WordMatcher::default_ident(), &TABLE, "    ").unwrap()
}

#[test]
fn a_body_generic_over_the_fields_trait_renders_the_native_node() {
    let function = Function {
        layout: None,
        name: ident("f"),
        parameters: vec![ident("a"), ident("b")],
        return_type: Some(ident("T")),
        separator: None,
    };
    assert_eq!(rendered(&function), "fn f(a,b)->T");
    let bare = Function { parameters: vec![], return_type: None, ..function };
    assert_eq!(rendered(&bare), "fn f");
}

#[test]
fn the_accessors_answer_the_fields() {
    let function = Function {
        layout: None,
        name: ident("f"),
        parameters: vec![ident("a")],
        return_type: None,
        separator: Some(KindId(4)),
    };
    assert_eq!(FunctionFields::separator(&function), Some(KindId(4)));
    assert!(FunctionFields::name(&function).is_present());
    assert!(!FunctionFields::return_type(&function).is_present());
    assert_eq!(sittir_core::view::SlotItems::count(&FunctionFields::parameters(&function)), 1);
    assert_eq!(FunctionFields::layout(&function).edges(), sittir_core::options::Edges::NONE);
}
