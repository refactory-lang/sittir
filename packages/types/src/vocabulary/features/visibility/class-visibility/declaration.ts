import type { GrammarMap } from '../../../map.ts';
import type { RefinedBy, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export namespace Constructor {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.member.constructor.private'> = 'declaration.member.constructor.private'> extends RefinedBy<V.Declaration.Member.Constructor<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by t
				readonly $path: K;
			}
			export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.constructor.protected'> = 'declaration.member.constructor.protected'> extends RefinedBy<V.Declaration.Member.Constructor<G, K>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.member.constructor.public'> = 'declaration.member.constructor.public'> extends RefinedBy<V.Declaration.Member.Constructor<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by t
				readonly $path: K;
			}
		}
		export namespace Field {
			export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.field.protected'> = 'declaration.member.field.protected'> extends RefinedBy<V.Declaration.Member.Field<G, K>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $path: K;
			}
			export namespace Signature {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.member.field.signature.private'> = 'declaration.member.field.signature.private'> extends RefinedBy<V.Declaration.Member.Field.Signature<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.field.signature.protected'> = 'declaration.member.field.signature.protected'> extends RefinedBy<V.Declaration.Member.Field.Signature<G, K>, V.Modifier.Visibility.Protected<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.member.field.signature.public'> = 'declaration.member.field.signature.public'> extends RefinedBy<V.Declaration.Member.Field.Signature<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by t
					readonly $path: K;
				}
			}
		}
		export namespace Method {
			export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.method.protected'> = 'declaration.member.method.protected'> extends RefinedBy<V.Declaration.Member.Method<G, K>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $path: K;
			}
			export namespace Signature {
				export namespace Abstract {
					export interface Private<G extends GrammarMap, K extends Under<'declaration.member.method.signature.abstract.private'> = 'declaration.member.method.signature.abstract.private'> extends RefinedBy<V.Declaration.Member.Method.Signature.Abstract<G, K>, V.Modifier.Visibility.Private<G>> {
						// claimed by t
						readonly $path: K;
					}
					export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.method.signature.abstract.protected'> = 'declaration.member.method.signature.abstract.protected'> extends RefinedBy<V.Declaration.Member.Method.Signature.Abstract<G, K>, V.Modifier.Visibility.Protected<G>> {
						// claimed by t
						readonly $path: K;
					}
					export interface Public<G extends GrammarMap, K extends Under<'declaration.member.method.signature.abstract.public'> = 'declaration.member.method.signature.abstract.public'> extends RefinedBy<V.Declaration.Member.Method.Signature.Abstract<G, K>, V.Modifier.Visibility.Public<G>> {
						// claimed by t
						readonly $path: K;
					}
				}
				export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.method.signature.protected'> = 'declaration.member.method.signature.protected'> extends RefinedBy<V.Declaration.Member.Method.Signature<G, K>, V.Modifier.Visibility.Protected<G>> {
					// claimed by t
					readonly $path: K;
				}
			}
		}
	}
	export namespace Parameter {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.parameter.private'> = 'declaration.parameter.private'> extends RefinedBy<V.Declaration.Parameter<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by t
			readonly $path: K;
		}
		export interface Protected<G extends GrammarMap, K extends Under<'declaration.parameter.protected'> = 'declaration.parameter.protected'> extends RefinedBy<V.Declaration.Parameter<G, K>, V.Modifier.Visibility.Protected<G>> {
			// claimed by t
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.parameter.public'> = 'declaration.parameter.public'> extends RefinedBy<V.Declaration.Parameter<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by t
			readonly $path: K;
		}
	}
	export namespace Member {
		export namespace Property {
			export namespace Getter {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.member.property.getter.private'> = 'declaration.member.property.getter.private'> extends RefinedBy<V.Declaration.Member.Property.Getter<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.property.getter.protected'> = 'declaration.member.property.getter.protected'> extends RefinedBy<V.Declaration.Member.Property.Getter<G, K>, V.Modifier.Visibility.Protected<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.member.property.getter.public'> = 'declaration.member.property.getter.public'> extends RefinedBy<V.Declaration.Member.Property.Getter<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by t
					readonly $path: K;
				}
			}
			export interface Private<G extends GrammarMap, K extends Under<'declaration.member.property.private'> = 'declaration.member.property.private'> extends RefinedBy<V.Declaration.Member.Property<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by t
				readonly $path: K;
			}
			export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.property.protected'> = 'declaration.member.property.protected'> extends RefinedBy<V.Declaration.Member.Property<G, K>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.member.property.public'> = 'declaration.member.property.public'> extends RefinedBy<V.Declaration.Member.Property<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by t
				readonly $path: K;
			}
			export namespace Setter {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.member.property.setter.private'> = 'declaration.member.property.setter.private'> extends RefinedBy<V.Declaration.Member.Property.Setter<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.property.setter.protected'> = 'declaration.member.property.setter.protected'> extends RefinedBy<V.Declaration.Member.Property.Setter<G, K>, V.Modifier.Visibility.Protected<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.member.property.setter.public'> = 'declaration.member.property.setter.public'> extends RefinedBy<V.Declaration.Member.Property.Setter<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by t
					readonly $path: K;
				}
			}
			export namespace Signature {
				export namespace Abstract {
					export namespace Getter {
						export interface Private<G extends GrammarMap, K extends Under<'declaration.member.property.signature.abstract.getter.private'> = 'declaration.member.property.signature.abstract.getter.private'> extends RefinedBy<V.Declaration.Member.Property.Signature.Abstract.Getter<G, K>, V.Modifier.Visibility.Private<G>> {
							// claimed by t
							readonly $path: K;
						}
						export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.property.signature.abstract.getter.protected'> = 'declaration.member.property.signature.abstract.getter.protected'> extends RefinedBy<V.Declaration.Member.Property.Signature.Abstract.Getter<G, K>, V.Modifier.Visibility.Protected<G>> {
							// claimed by t
							readonly $path: K;
						}
						export interface Public<G extends GrammarMap, K extends Under<'declaration.member.property.signature.abstract.getter.public'> = 'declaration.member.property.signature.abstract.getter.public'> extends RefinedBy<V.Declaration.Member.Property.Signature.Abstract.Getter<G, K>, V.Modifier.Visibility.Public<G>> {
							// claimed by t
							readonly $path: K;
						}
					}
					export namespace Setter {
						export interface Private<G extends GrammarMap, K extends Under<'declaration.member.property.signature.abstract.setter.private'> = 'declaration.member.property.signature.abstract.setter.private'> extends RefinedBy<V.Declaration.Member.Property.Signature.Abstract.Setter<G, K>, V.Modifier.Visibility.Private<G>> {
							// claimed by t
							readonly $path: K;
						}
						export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.property.signature.abstract.setter.protected'> = 'declaration.member.property.signature.abstract.setter.protected'> extends RefinedBy<V.Declaration.Member.Property.Signature.Abstract.Setter<G, K>, V.Modifier.Visibility.Protected<G>> {
							// claimed by t
							readonly $path: K;
						}
						export interface Public<G extends GrammarMap, K extends Under<'declaration.member.property.signature.abstract.setter.public'> = 'declaration.member.property.signature.abstract.setter.public'> extends RefinedBy<V.Declaration.Member.Property.Signature.Abstract.Setter<G, K>, V.Modifier.Visibility.Public<G>> {
							// claimed by t
							readonly $path: K;
						}
					}
				}
				export namespace Getter {
					export interface Private<G extends GrammarMap, K extends Under<'declaration.member.property.signature.getter.private'> = 'declaration.member.property.signature.getter.private'> extends RefinedBy<V.Declaration.Member.Property.Signature.Getter<G, K>, V.Modifier.Visibility.Private<G>> {
						// claimed by t
						readonly $path: K;
					}
					export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.property.signature.getter.protected'> = 'declaration.member.property.signature.getter.protected'> extends RefinedBy<V.Declaration.Member.Property.Signature.Getter<G, K>, V.Modifier.Visibility.Protected<G>> {
						// claimed by t
						readonly $path: K;
					}
					export interface Public<G extends GrammarMap, K extends Under<'declaration.member.property.signature.getter.public'> = 'declaration.member.property.signature.getter.public'> extends RefinedBy<V.Declaration.Member.Property.Signature.Getter<G, K>, V.Modifier.Visibility.Public<G>> {
						// claimed by t
						readonly $path: K;
					}
				}
				export namespace Setter {
					export interface Private<G extends GrammarMap, K extends Under<'declaration.member.property.signature.setter.private'> = 'declaration.member.property.signature.setter.private'> extends RefinedBy<V.Declaration.Member.Property.Signature.Setter<G, K>, V.Modifier.Visibility.Private<G>> {
						// claimed by t
						readonly $path: K;
					}
					export interface Protected<G extends GrammarMap, K extends Under<'declaration.member.property.signature.setter.protected'> = 'declaration.member.property.signature.setter.protected'> extends RefinedBy<V.Declaration.Member.Property.Signature.Setter<G, K>, V.Modifier.Visibility.Protected<G>> {
						// claimed by t
						readonly $path: K;
					}
					export interface Public<G extends GrammarMap, K extends Under<'declaration.member.property.signature.setter.public'> = 'declaration.member.property.signature.setter.public'> extends RefinedBy<V.Declaration.Member.Property.Signature.Setter<G, K>, V.Modifier.Visibility.Public<G>> {
						// claimed by t
						readonly $path: K;
					}
				}
			}
		}
	}
}
