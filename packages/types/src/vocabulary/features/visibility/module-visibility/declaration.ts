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
	export namespace Type {
		export namespace Enum {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.type.enum.private'> = 'declaration.type.enum.private'> extends RefinedBy<V.Declaration.Type.Enum<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.type.enum.public'> = 'declaration.type.enum.public'> extends RefinedBy<V.Declaration.Type.Enum<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.type.enum.public.internal'> = 'declaration.type.enum.public.internal'> extends RefinedBy<V.Declaration.Type.Enum.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.type.enum.public.parent'> = 'declaration.type.enum.public.parent'> extends RefinedBy<V.Declaration.Type.Enum.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.type.enum.public.restricted'> = 'declaration.type.enum.public.restricted'> extends RefinedBy<V.Declaration.Type.Enum.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
		}
	}
	export namespace Member {
		export namespace EnumMember {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.member.enum_member.private'> = 'declaration.member.enum_member.private'> extends RefinedBy<V.Declaration.Member.EnumMember<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.member.enum_member.public'> = 'declaration.member.enum_member.public'> extends RefinedBy<V.Declaration.Member.EnumMember<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.member.enum_member.public.internal'> = 'declaration.member.enum_member.public.internal'> extends RefinedBy<V.Declaration.Member.EnumMember.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.member.enum_member.public.parent'> = 'declaration.member.enum_member.public.parent'> extends RefinedBy<V.Declaration.Member.EnumMember.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.member.enum_member.public.restricted'> = 'declaration.member.enum_member.public.restricted'> extends RefinedBy<V.Declaration.Member.EnumMember.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
			export namespace Struct {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.member.enum_member.struct.private'> = 'declaration.member.enum_member.struct.private'> extends RefinedBy<V.Declaration.Member.EnumMember.Struct<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.member.enum_member.struct.public'> = 'declaration.member.enum_member.struct.public'> extends RefinedBy<V.Declaration.Member.EnumMember.Struct<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by r
					readonly $path: K;
				}
				export namespace Public {
					export interface Internal<G extends GrammarMap, K extends Under<'declaration.member.enum_member.struct.public.internal'> = 'declaration.member.enum_member.struct.public.internal'> extends RefinedBy<V.Declaration.Member.EnumMember.Struct.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Parent<G extends GrammarMap, K extends Under<'declaration.member.enum_member.struct.public.parent'> = 'declaration.member.enum_member.struct.public.parent'> extends RefinedBy<V.Declaration.Member.EnumMember.Struct.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Restricted<G extends GrammarMap, K extends Under<'declaration.member.enum_member.struct.public.restricted'> = 'declaration.member.enum_member.struct.public.restricted'> extends RefinedBy<V.Declaration.Member.EnumMember.Struct.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
						// claimed by r
						readonly $path: K;
					}
				}
			}
			export namespace Tuple {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.member.enum_member.tuple.private'> = 'declaration.member.enum_member.tuple.private'> extends RefinedBy<V.Declaration.Member.EnumMember.Tuple<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.member.enum_member.tuple.public'> = 'declaration.member.enum_member.tuple.public'> extends RefinedBy<V.Declaration.Member.EnumMember.Tuple<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by r
					readonly $path: K;
				}
				export namespace Public {
					export interface Internal<G extends GrammarMap, K extends Under<'declaration.member.enum_member.tuple.public.internal'> = 'declaration.member.enum_member.tuple.public.internal'> extends RefinedBy<V.Declaration.Member.EnumMember.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Parent<G extends GrammarMap, K extends Under<'declaration.member.enum_member.tuple.public.parent'> = 'declaration.member.enum_member.tuple.public.parent'> extends RefinedBy<V.Declaration.Member.EnumMember.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Restricted<G extends GrammarMap, K extends Under<'declaration.member.enum_member.tuple.public.restricted'> = 'declaration.member.enum_member.tuple.public.restricted'> extends RefinedBy<V.Declaration.Member.EnumMember.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
						// claimed by r
						readonly $path: K;
					}
				}
			}
		}
		export namespace Field {
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.member.field.public.internal'> = 'declaration.member.field.public.internal'> extends RefinedBy<V.Declaration.Member.Field.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.member.field.public.parent'> = 'declaration.member.field.public.parent'> extends RefinedBy<V.Declaration.Member.Field.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.member.field.public.restricted'> = 'declaration.member.field.public.restricted'> extends RefinedBy<V.Declaration.Member.Field.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
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
	export namespace Type {
		export namespace Interface {
			export namespace Trait {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.type.interface.trait.private'> = 'declaration.type.interface.trait.private'> extends RefinedBy<V.Declaration.Type.Interface.Trait<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.type.interface.trait.public'> = 'declaration.type.interface.trait.public'> extends RefinedBy<V.Declaration.Type.Interface.Trait<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by r
					readonly $path: K;
				}
				export namespace Public {
					export interface Internal<G extends GrammarMap, K extends Under<'declaration.type.interface.trait.public.internal'> = 'declaration.type.interface.trait.public.internal'> extends RefinedBy<V.Declaration.Type.Interface.Trait.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Parent<G extends GrammarMap, K extends Under<'declaration.type.interface.trait.public.parent'> = 'declaration.type.interface.trait.public.parent'> extends RefinedBy<V.Declaration.Type.Interface.Trait.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Restricted<G extends GrammarMap, K extends Under<'declaration.type.interface.trait.public.restricted'> = 'declaration.type.interface.trait.public.restricted'> extends RefinedBy<V.Declaration.Type.Interface.Trait.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
						// claimed by r
						readonly $path: K;
					}
				}
			}
		}
	}
	export namespace Member {
		export namespace Method {
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.member.method.public.internal'> = 'declaration.member.method.public.internal'> extends RefinedBy<V.Declaration.Member.Method.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.member.method.public.parent'> = 'declaration.member.method.public.parent'> extends RefinedBy<V.Declaration.Member.Method.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.member.method.public.restricted'> = 'declaration.member.method.public.restricted'> extends RefinedBy<V.Declaration.Member.Method.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
			export namespace Signature {
				export namespace Public {
					export interface Internal<G extends GrammarMap, K extends Under<'declaration.member.method.signature.public.internal'> = 'declaration.member.method.signature.public.internal'> extends RefinedBy<V.Declaration.Member.Method.Signature.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Parent<G extends GrammarMap, K extends Under<'declaration.member.method.signature.public.parent'> = 'declaration.member.method.signature.public.parent'> extends RefinedBy<V.Declaration.Member.Method.Signature.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Restricted<G extends GrammarMap, K extends Under<'declaration.member.method.signature.public.restricted'> = 'declaration.member.method.signature.public.restricted'> extends RefinedBy<V.Declaration.Member.Method.Signature.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
						// claimed by r
						readonly $path: K;
					}
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
	export namespace Type {
		export namespace Struct {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.type.struct.private'> = 'declaration.type.struct.private'> extends RefinedBy<V.Declaration.Type.Struct<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.type.struct.public'> = 'declaration.type.struct.public'> extends RefinedBy<V.Declaration.Type.Struct<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.type.struct.public.internal'> = 'declaration.type.struct.public.internal'> extends RefinedBy<V.Declaration.Type.Struct.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.type.struct.public.parent'> = 'declaration.type.struct.public.parent'> extends RefinedBy<V.Declaration.Type.Struct.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.type.struct.public.restricted'> = 'declaration.type.struct.public.restricted'> extends RefinedBy<V.Declaration.Type.Struct.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
			export namespace Tuple {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.type.struct.tuple.private'> = 'declaration.type.struct.tuple.private'> extends RefinedBy<V.Declaration.Type.Struct.Tuple<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.type.struct.tuple.public'> = 'declaration.type.struct.tuple.public'> extends RefinedBy<V.Declaration.Type.Struct.Tuple<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by r
					readonly $path: K;
				}
				export namespace Public {
					export interface Internal<G extends GrammarMap, K extends Under<'declaration.type.struct.tuple.public.internal'> = 'declaration.type.struct.tuple.public.internal'> extends RefinedBy<V.Declaration.Type.Struct.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Parent<G extends GrammarMap, K extends Under<'declaration.type.struct.tuple.public.parent'> = 'declaration.type.struct.tuple.public.parent'> extends RefinedBy<V.Declaration.Type.Struct.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Restricted<G extends GrammarMap, K extends Under<'declaration.type.struct.tuple.public.restricted'> = 'declaration.type.struct.tuple.public.restricted'> extends RefinedBy<V.Declaration.Type.Struct.Tuple.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
						// claimed by r
						readonly $path: K;
					}
				}
			}
			export namespace Unit {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.type.struct.unit.private'> = 'declaration.type.struct.unit.private'> extends RefinedBy<V.Declaration.Type.Struct.Unit<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.type.struct.unit.public'> = 'declaration.type.struct.unit.public'> extends RefinedBy<V.Declaration.Type.Struct.Unit<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by r
					readonly $path: K;
				}
				export namespace Public {
					export interface Internal<G extends GrammarMap, K extends Under<'declaration.type.struct.unit.public.internal'> = 'declaration.type.struct.unit.public.internal'> extends RefinedBy<V.Declaration.Type.Struct.Unit.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Parent<G extends GrammarMap, K extends Under<'declaration.type.struct.unit.public.parent'> = 'declaration.type.struct.unit.public.parent'> extends RefinedBy<V.Declaration.Type.Struct.Unit.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
						// claimed by r
						readonly $path: K;
					}
					export interface Restricted<G extends GrammarMap, K extends Under<'declaration.type.struct.unit.public.restricted'> = 'declaration.type.struct.unit.public.restricted'> extends RefinedBy<V.Declaration.Type.Struct.Unit.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
						// claimed by r
						readonly $path: K;
					}
				}
			}
		}
		export namespace TypeAlias {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.type.type_alias.private'> = 'declaration.type.type_alias.private'> extends RefinedBy<V.Declaration.Type.TypeAlias<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.type.type_alias.public'> = 'declaration.type.type_alias.public'> extends RefinedBy<V.Declaration.Type.TypeAlias<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.type.type_alias.public.internal'> = 'declaration.type.type_alias.public.internal'> extends RefinedBy<V.Declaration.Type.TypeAlias.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.type.type_alias.public.parent'> = 'declaration.type.type_alias.public.parent'> extends RefinedBy<V.Declaration.Type.TypeAlias.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.type.type_alias.public.restricted'> = 'declaration.type.type_alias.public.restricted'> extends RefinedBy<V.Declaration.Type.TypeAlias.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
		}
		export namespace Union {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.type.union.private'> = 'declaration.type.union.private'> extends RefinedBy<V.Declaration.Type.Union<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.type.union.public'> = 'declaration.type.union.public'> extends RefinedBy<V.Declaration.Type.Union<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'declaration.type.union.public.internal'> = 'declaration.type.union.public.internal'> extends RefinedBy<V.Declaration.Type.Union.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'declaration.type.union.public.parent'> = 'declaration.type.union.public.parent'> extends RefinedBy<V.Declaration.Type.Union.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'declaration.type.union.public.restricted'> = 'declaration.type.union.public.restricted'> extends RefinedBy<V.Declaration.Type.Union.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
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
