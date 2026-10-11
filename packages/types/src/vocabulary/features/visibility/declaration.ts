import type { GrammarContext } from '../../context.ts';
import type { RefinedBy } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Constant {
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Constant<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $kind: 'declaration.constant.private';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Constant<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $kind: 'declaration.constant.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Constant.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $kind: 'declaration.constant.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Constant.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $kind: 'declaration.constant.public.restricted';
			}
		}
	}
	export namespace Constructor {
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Constructor<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by t
			readonly $kind: 'declaration.constructor.private';
		}
		export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Constructor<G>, V.Modifier.Visibility.Protected<G>> {
			// claimed by t
			readonly $kind: 'declaration.constructor.protected';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Constructor<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by t
			readonly $kind: 'declaration.constructor.public';
		}
	}
	export namespace Enum {
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Enum<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $kind: 'declaration.enum.private';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Enum<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $kind: 'declaration.enum.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Enum.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $kind: 'declaration.enum.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Enum.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $kind: 'declaration.enum.public.restricted';
			}
		}
	}
	export namespace EnumMember {
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $kind: 'declaration.enum_member.private';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $kind: 'declaration.enum_member.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $kind: 'declaration.enum_member.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $kind: 'declaration.enum_member.public.restricted';
			}
		}
		export namespace Struct {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember.Struct<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $kind: 'declaration.enum_member.struct.private';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember.Struct<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'declaration.enum_member.struct.public';
			}
			export namespace Public {
				export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember.Struct.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $kind: 'declaration.enum_member.struct.public.internal';
				}
				export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember.Struct.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $kind: 'declaration.enum_member.struct.public.restricted';
				}
			}
		}
		export namespace Tuple {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember.Tuple<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $kind: 'declaration.enum_member.tuple.private';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember.Tuple<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'declaration.enum_member.tuple.public';
			}
			export namespace Public {
				export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember.Tuple.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $kind: 'declaration.enum_member.tuple.public.internal';
				}
				export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.EnumMember.Tuple.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $kind: 'declaration.enum_member.tuple.public.restricted';
				}
			}
		}
	}
	export namespace Field {
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Field<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by rt
			readonly $kind: 'declaration.field.private';
		}
		export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Field<G>, V.Modifier.Visibility.Protected<G>> {
			// claimed by t
			readonly $kind: 'declaration.field.protected';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Field<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by rt
			readonly $kind: 'declaration.field.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Field.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $kind: 'declaration.field.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Field.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $kind: 'declaration.field.public.restricted';
			}
		}
		export namespace Signature {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Field.Signature<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by t
				readonly $kind: 'declaration.field.signature.private';
			}
			export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Field.Signature<G>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $kind: 'declaration.field.signature.protected';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Field.Signature<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by t
				readonly $kind: 'declaration.field.signature.public';
			}
		}
	}
	export namespace Function {
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Function<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $kind: 'declaration.function.private';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Function<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $kind: 'declaration.function.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Function.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $kind: 'declaration.function.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Function.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $kind: 'declaration.function.public.restricted';
			}
		}
		export namespace Signature {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Function.Signature<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $kind: 'declaration.function.signature.private';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Function.Signature<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'declaration.function.signature.public';
			}
			export namespace Public {
				export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Function.Signature.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $kind: 'declaration.function.signature.public.internal';
				}
				export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Function.Signature.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $kind: 'declaration.function.signature.public.restricted';
				}
			}
		}
	}
	export namespace Interface {
		export namespace Trait {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Interface.Trait<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $kind: 'declaration.interface.trait.private';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Interface.Trait<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'declaration.interface.trait.public';
			}
			export namespace Public {
				export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Interface.Trait.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $kind: 'declaration.interface.trait.public.internal';
				}
				export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Interface.Trait.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $kind: 'declaration.interface.trait.public.restricted';
				}
			}
		}
	}
	export namespace Method {
		export namespace Getter {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Getter<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by t
				readonly $kind: 'declaration.method.getter.private';
			}
			export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Getter<G>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $kind: 'declaration.method.getter.protected';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Getter<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by t
				readonly $kind: 'declaration.method.getter.public';
			}
		}
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by rt
			readonly $kind: 'declaration.method.private';
		}
		export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method<G>, V.Modifier.Visibility.Protected<G>> {
			// claimed by t
			readonly $kind: 'declaration.method.protected';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by rt
			readonly $kind: 'declaration.method.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $kind: 'declaration.method.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $kind: 'declaration.method.public.restricted';
			}
		}
		export namespace Setter {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Setter<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by t
				readonly $kind: 'declaration.method.setter.private';
			}
			export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Setter<G>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $kind: 'declaration.method.setter.protected';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Setter<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by t
				readonly $kind: 'declaration.method.setter.public';
			}
		}
		export namespace Signature {
			export namespace Abstract {
				export namespace Getter {
					export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Abstract.Getter<G>, V.Modifier.Visibility.Private<G>> {
						// claimed by t
						readonly $kind: 'declaration.method.signature.abstract.getter.private';
					}
					export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Abstract.Getter<G>, V.Modifier.Visibility.Protected<G>> {
						// claimed by t
						readonly $kind: 'declaration.method.signature.abstract.getter.protected';
					}
					export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Abstract.Getter<G>, V.Modifier.Visibility.Public<G>> {
						// claimed by t
						readonly $kind: 'declaration.method.signature.abstract.getter.public';
					}
				}
				export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Abstract<G>, V.Modifier.Visibility.Private<G>> {
					// claimed by t
					readonly $kind: 'declaration.method.signature.abstract.private';
				}
				export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Abstract<G>, V.Modifier.Visibility.Protected<G>> {
					// claimed by t
					readonly $kind: 'declaration.method.signature.abstract.protected';
				}
				export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Abstract<G>, V.Modifier.Visibility.Public<G>> {
					// claimed by t
					readonly $kind: 'declaration.method.signature.abstract.public';
				}
				export namespace Setter {
					export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Abstract.Setter<G>, V.Modifier.Visibility.Private<G>> {
						// claimed by t
						readonly $kind: 'declaration.method.signature.abstract.setter.private';
					}
					export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Abstract.Setter<G>, V.Modifier.Visibility.Protected<G>> {
						// claimed by t
						readonly $kind: 'declaration.method.signature.abstract.setter.protected';
					}
					export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Abstract.Setter<G>, V.Modifier.Visibility.Public<G>> {
						// claimed by t
						readonly $kind: 'declaration.method.signature.abstract.setter.public';
					}
				}
			}
			export namespace Getter {
				export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Getter<G>, V.Modifier.Visibility.Private<G>> {
					// claimed by t
					readonly $kind: 'declaration.method.signature.getter.private';
				}
				export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Getter<G>, V.Modifier.Visibility.Protected<G>> {
					// claimed by t
					readonly $kind: 'declaration.method.signature.getter.protected';
				}
				export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Getter<G>, V.Modifier.Visibility.Public<G>> {
					// claimed by t
					readonly $kind: 'declaration.method.signature.getter.public';
				}
			}
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by rt
				readonly $kind: 'declaration.method.signature.private';
			}
			export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature<G>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $kind: 'declaration.method.signature.protected';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by rt
				readonly $kind: 'declaration.method.signature.public';
			}
			export namespace Public {
				export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $kind: 'declaration.method.signature.public.internal';
				}
				export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $kind: 'declaration.method.signature.public.restricted';
				}
			}
			export namespace Setter {
				export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Setter<G>, V.Modifier.Visibility.Private<G>> {
					// claimed by t
					readonly $kind: 'declaration.method.signature.setter.private';
				}
				export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Setter<G>, V.Modifier.Visibility.Protected<G>> {
					// claimed by t
					readonly $kind: 'declaration.method.signature.setter.protected';
				}
				export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Signature.Setter<G>, V.Modifier.Visibility.Public<G>> {
					// claimed by t
					readonly $kind: 'declaration.method.signature.setter.public';
				}
			}
		}
		export namespace Static {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Static<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $kind: 'declaration.method.static.private';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Static<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'declaration.method.static.public';
			}
			export namespace Public {
				export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Static.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $kind: 'declaration.method.static.public.internal';
				}
				export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Method.Static.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $kind: 'declaration.method.static.public.restricted';
				}
			}
		}
	}
	export namespace Module {
		export namespace Foreign {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Module.Foreign<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $kind: 'declaration.module.foreign.private';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Module.Foreign<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'declaration.module.foreign.public';
			}
			export namespace Public {
				export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Module.Foreign.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $kind: 'declaration.module.foreign.public.internal';
				}
				export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Module.Foreign.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $kind: 'declaration.module.foreign.public.restricted';
				}
			}
		}
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Module<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $kind: 'declaration.module.private';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Module<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $kind: 'declaration.module.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Module.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $kind: 'declaration.module.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Module.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $kind: 'declaration.module.public.restricted';
			}
		}
	}
	export namespace Parameter {
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Parameter<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by t
			readonly $kind: 'declaration.parameter.private';
		}
		export interface Protected<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Parameter<G>, V.Modifier.Visibility.Protected<G>> {
			// claimed by t
			readonly $kind: 'declaration.parameter.protected';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Parameter<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by t
			readonly $kind: 'declaration.parameter.public';
		}
	}
	export namespace Struct {
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $kind: 'declaration.struct.private';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $kind: 'declaration.struct.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $kind: 'declaration.struct.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $kind: 'declaration.struct.public.restricted';
			}
		}
		export namespace Tuple {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct.Tuple<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $kind: 'declaration.struct.tuple.private';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct.Tuple<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'declaration.struct.tuple.public';
			}
			export namespace Public {
				export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct.Tuple.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $kind: 'declaration.struct.tuple.public.internal';
				}
				export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct.Tuple.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $kind: 'declaration.struct.tuple.public.restricted';
				}
			}
		}
		export namespace Unit {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct.Unit<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $kind: 'declaration.struct.unit.private';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct.Unit<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'declaration.struct.unit.public';
			}
			export namespace Public {
				export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct.Unit.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $kind: 'declaration.struct.unit.public.internal';
				}
				export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Struct.Unit.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $kind: 'declaration.struct.unit.public.restricted';
				}
			}
		}
	}
	export namespace TypeAlias {
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.TypeAlias<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $kind: 'declaration.type_alias.private';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.TypeAlias<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $kind: 'declaration.type_alias.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.TypeAlias.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $kind: 'declaration.type_alias.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.TypeAlias.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $kind: 'declaration.type_alias.public.restricted';
			}
		}
	}
	export namespace Union {
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Union<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $kind: 'declaration.union.private';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Union<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $kind: 'declaration.union.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Union.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $kind: 'declaration.union.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Union.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $kind: 'declaration.union.public.restricted';
			}
		}
	}
	export namespace Variable {
		export namespace Static {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Variable.Static<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $kind: 'declaration.variable.static.private';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Variable.Static<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'declaration.variable.static.public';
			}
			export namespace Public {
				export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Variable.Static.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $kind: 'declaration.variable.static.public.internal';
				}
				export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Declaration.Variable.Static.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $kind: 'declaration.variable.static.public.restricted';
				}
			}
		}
	}
}
