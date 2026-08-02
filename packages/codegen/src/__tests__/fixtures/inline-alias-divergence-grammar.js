/// A grammar whose only alias target (`orphan_target`) has no declared rule
/// and no inline: / SYMBOL source — forces synthesizeInlineAliasSources (S2)
/// to mint `_orphan_target`, which has no wire-side counterpart. Exercises
/// the desugar-divergence assertion in isolation.
module.exports = grammar({
	name: 'inline_alias_divergence',

	rules: {
		host: ($) => seq(alias(seq('x', 'y'), $.orphan_target), 'z')
	}
});
