import type { GrammarMap } from '../../../map.ts';
import type { RefinedBy, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Constant {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.constant.private'> = 'declaration.constant.private'> extends RefinedBy<V.Declaration.Constant<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.constant.public'> = 'declaration.constant.public'> extends RefinedBy<V.Declaration.Constant<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $path: K;
		}
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'declaration.constant.public.internal'> = 'declaration.constant.public.internal'> extends RefinedBy<V.Declaration.Constant.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'declaration.constant.public.parent'> = 'declaration.constant.public.parent'> extends RefinedBy<V.Declaration.Constant.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'declaration.constant.public.restricted'> = 'declaration.constant.public.restricted'> extends RefinedBy<V.Declaration.Constant.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
	}
	export namespace Enum {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.enum.private'> = 'declaration.enum.private'> extends RefinedBy<V.Declaration.Enum<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.enum.public'> = 'declaration.enum.public'> extends RefinedBy<V.Declaration.Enum<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $path: K;
		}
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'declaration.enum.public.internal'> = 'declaration.enum.public.internal'> extends RefinedBy<V.Declaration.Enum.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'declaration.enum.public.parent'> = 'declaration.enum.public.parent'> extends RefinedBy<V.Declaration.Enum.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'declaration.enum.public.restricted'> = 'declaration.enum.public.restricted'> extends RefinedBy<V.Declaration.Enum.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
	}
	export namespace EnumMember {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.enum_member.private'> = 'declaration.enum_member.private'> extends RefinedBy<V.Declaration.EnumMember<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.enum_member.public'> = 'declaration.enum_member.public'> extends RefinedBy<V.Declaration.EnumMember<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $path: K;
		}
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'declaration.enum_member.public.internal'> = 'declaration.enum_member.public.internal'> extends RefinedBy<V.Declaration.EnumMember.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'declaration.enum_member.public.parent'> = 'declaration.enum_member.public.parent'> extends RefinedBy<V.Declaration.EnumMember.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'declaration.enum_member.public.restricted'> = 'declaration.enum_member.public.restricted'> extends RefinedBy<V.Declaration.EnumMember.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
		export namespace Struct {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.enum_member.struct.private'> = 'declaration.enum_member.struct.private'> extends RefinedBy<V.Declaration.EnumMember.Struct<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.enum_member.struct.public'> = 'declaration.enum_member.struct.public'> extends RefinedBy<V.Declaration.EnumMember.Struct<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.enum_member.struct.public.internal'> = 'declaration.enum_member.struct.public.internal'> extends RefinedBy<V.Declaration.EnumMember.Struct.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.enum_member.struct.public.parent'> = 'declaration.enum_member.struct.public.parent'> extends RefinedBy<V.Declaration.EnumMember.Struct.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.enum_member.struct.public.restricted'> = 'declaration.enum_member.struct.public.restricted'> extends RefinedBy<V.Declaration.EnumMember.Struct.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
		}
		export namespace Tuple {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.enum_member.tuple.private'> = 'declaration.enum_member.tuple.private'> extends RefinedBy<V.Declaration.EnumMember.Tuple<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.enum_member.tuple.public'> = 'declaration.enum_member.tuple.public'> extends RefinedBy<V.Declaration.EnumMember.Tuple<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.enum_member.tuple.public.internal'> = 'declaration.enum_member.tuple.public.internal'> extends RefinedBy<V.Declaration.EnumMember.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.enum_member.tuple.public.parent'> = 'declaration.enum_member.tuple.public.parent'> extends RefinedBy<V.Declaration.EnumMember.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.enum_member.tuple.public.restricted'> = 'declaration.enum_member.tuple.public.restricted'> extends RefinedBy<V.Declaration.EnumMember.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
		}
	}
	export namespace Field {
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'declaration.field.public.internal'> = 'declaration.field.public.internal'> extends RefinedBy<V.Declaration.Field.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'declaration.field.public.parent'> = 'declaration.field.public.parent'> extends RefinedBy<V.Declaration.Field.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'declaration.field.public.restricted'> = 'declaration.field.public.restricted'> extends RefinedBy<V.Declaration.Field.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
	}
	export namespace Function {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.function.private'> = 'declaration.function.private'> extends RefinedBy<V.Declaration.Function<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.function.public'> = 'declaration.function.public'> extends RefinedBy<V.Declaration.Function<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $path: K;
		}
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'declaration.function.public.internal'> = 'declaration.function.public.internal'> extends RefinedBy<V.Declaration.Function.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'declaration.function.public.parent'> = 'declaration.function.public.parent'> extends RefinedBy<V.Declaration.Function.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'declaration.function.public.restricted'> = 'declaration.function.public.restricted'> extends RefinedBy<V.Declaration.Function.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
		export namespace Signature {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.function.signature.private'> = 'declaration.function.signature.private'> extends RefinedBy<V.Declaration.Function.Signature<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.function.signature.public'> = 'declaration.function.signature.public'> extends RefinedBy<V.Declaration.Function.Signature<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.function.signature.public.internal'> = 'declaration.function.signature.public.internal'> extends RefinedBy<V.Declaration.Function.Signature.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.function.signature.public.parent'> = 'declaration.function.signature.public.parent'> extends RefinedBy<V.Declaration.Function.Signature.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.function.signature.public.restricted'> = 'declaration.function.signature.public.restricted'> extends RefinedBy<V.Declaration.Function.Signature.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
		}
	}
	export namespace Interface {
		export namespace Trait {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.interface.trait.private'> = 'declaration.interface.trait.private'> extends RefinedBy<V.Declaration.Interface.Trait<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.interface.trait.public'> = 'declaration.interface.trait.public'> extends RefinedBy<V.Declaration.Interface.Trait<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.interface.trait.public.internal'> = 'declaration.interface.trait.public.internal'> extends RefinedBy<V.Declaration.Interface.Trait.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.interface.trait.public.parent'> = 'declaration.interface.trait.public.parent'> extends RefinedBy<V.Declaration.Interface.Trait.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.interface.trait.public.restricted'> = 'declaration.interface.trait.public.restricted'> extends RefinedBy<V.Declaration.Interface.Trait.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
		}
	}
	export namespace Method {
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'declaration.method.public.internal'> = 'declaration.method.public.internal'> extends RefinedBy<V.Declaration.Method.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'declaration.method.public.parent'> = 'declaration.method.public.parent'> extends RefinedBy<V.Declaration.Method.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'declaration.method.public.restricted'> = 'declaration.method.public.restricted'> extends RefinedBy<V.Declaration.Method.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
		export namespace Signature {
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.method.signature.public.internal'> = 'declaration.method.signature.public.internal'> extends RefinedBy<V.Declaration.Method.Signature.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.method.signature.public.parent'> = 'declaration.method.signature.public.parent'> extends RefinedBy<V.Declaration.Method.Signature.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.method.signature.public.restricted'> = 'declaration.method.signature.public.restricted'> extends RefinedBy<V.Declaration.Method.Signature.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
		}
	}
	export namespace Module {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.module.private'> = 'declaration.module.private'> extends RefinedBy<V.Declaration.Module<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.module.public'> = 'declaration.module.public'> extends RefinedBy<V.Declaration.Module<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $path: K;
		}
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'declaration.module.public.internal'> = 'declaration.module.public.internal'> extends RefinedBy<V.Declaration.Module.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'declaration.module.public.parent'> = 'declaration.module.public.parent'> extends RefinedBy<V.Declaration.Module.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'declaration.module.public.restricted'> = 'declaration.module.public.restricted'> extends RefinedBy<V.Declaration.Module.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
	}
	export namespace Struct {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.struct.private'> = 'declaration.struct.private'> extends RefinedBy<V.Declaration.Struct<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.struct.public'> = 'declaration.struct.public'> extends RefinedBy<V.Declaration.Struct<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $path: K;
		}
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'declaration.struct.public.internal'> = 'declaration.struct.public.internal'> extends RefinedBy<V.Declaration.Struct.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'declaration.struct.public.parent'> = 'declaration.struct.public.parent'> extends RefinedBy<V.Declaration.Struct.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'declaration.struct.public.restricted'> = 'declaration.struct.public.restricted'> extends RefinedBy<V.Declaration.Struct.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
		export namespace Tuple {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.struct.tuple.private'> = 'declaration.struct.tuple.private'> extends RefinedBy<V.Declaration.Struct.Tuple<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.struct.tuple.public'> = 'declaration.struct.tuple.public'> extends RefinedBy<V.Declaration.Struct.Tuple<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.struct.tuple.public.internal'> = 'declaration.struct.tuple.public.internal'> extends RefinedBy<V.Declaration.Struct.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.struct.tuple.public.parent'> = 'declaration.struct.tuple.public.parent'> extends RefinedBy<V.Declaration.Struct.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.struct.tuple.public.restricted'> = 'declaration.struct.tuple.public.restricted'> extends RefinedBy<V.Declaration.Struct.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
		}
		export namespace Unit {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.struct.unit.private'> = 'declaration.struct.unit.private'> extends RefinedBy<V.Declaration.Struct.Unit<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.struct.unit.public'> = 'declaration.struct.unit.public'> extends RefinedBy<V.Declaration.Struct.Unit<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.struct.unit.public.internal'> = 'declaration.struct.unit.public.internal'> extends RefinedBy<V.Declaration.Struct.Unit.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.struct.unit.public.parent'> = 'declaration.struct.unit.public.parent'> extends RefinedBy<V.Declaration.Struct.Unit.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.struct.unit.public.restricted'> = 'declaration.struct.unit.public.restricted'> extends RefinedBy<V.Declaration.Struct.Unit.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
		}
	}
	export namespace TypeAlias {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.type_alias.private'> = 'declaration.type_alias.private'> extends RefinedBy<V.Declaration.TypeAlias<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.type_alias.public'> = 'declaration.type_alias.public'> extends RefinedBy<V.Declaration.TypeAlias<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $path: K;
		}
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'declaration.type_alias.public.internal'> = 'declaration.type_alias.public.internal'> extends RefinedBy<V.Declaration.TypeAlias.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'declaration.type_alias.public.parent'> = 'declaration.type_alias.public.parent'> extends RefinedBy<V.Declaration.TypeAlias.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'declaration.type_alias.public.restricted'> = 'declaration.type_alias.public.restricted'> extends RefinedBy<V.Declaration.TypeAlias.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
	}
	export namespace Union {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.union.private'> = 'declaration.union.private'> extends RefinedBy<V.Declaration.Union<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.union.public'> = 'declaration.union.public'> extends RefinedBy<V.Declaration.Union<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $path: K;
		}
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'declaration.union.public.internal'> = 'declaration.union.public.internal'> extends RefinedBy<V.Declaration.Union.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'declaration.union.public.parent'> = 'declaration.union.public.parent'> extends RefinedBy<V.Declaration.Union.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'declaration.union.public.restricted'> = 'declaration.union.public.restricted'> extends RefinedBy<V.Declaration.Union.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
	}
	export namespace Variable {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.variable.private'> = 'declaration.variable.private'> extends RefinedBy<V.Declaration.Variable<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.variable.public'> = 'declaration.variable.public'> extends RefinedBy<V.Declaration.Variable<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $path: K;
		}
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'declaration.variable.public.internal'> = 'declaration.variable.public.internal'> extends RefinedBy<V.Declaration.Variable.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'declaration.variable.public.parent'> = 'declaration.variable.public.parent'> extends RefinedBy<V.Declaration.Variable.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'declaration.variable.public.restricted'> = 'declaration.variable.public.restricted'> extends RefinedBy<V.Declaration.Variable.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
	}
}
