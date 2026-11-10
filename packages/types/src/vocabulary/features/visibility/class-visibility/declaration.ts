import type { GrammarMap } from '../../../map.ts';
import type { RefinedBy, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Constructor {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.constructor.private'> = 'declaration.constructor.private'> extends RefinedBy<V.Declaration.Constructor<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by t
			readonly $path: K;
		}
		export interface Protected<G extends GrammarMap, K extends Under<'declaration.constructor.protected'> = 'declaration.constructor.protected'> extends RefinedBy<V.Declaration.Constructor<G, K>, V.Modifier.Visibility.Protected<G>> {
			// claimed by t
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.constructor.public'> = 'declaration.constructor.public'> extends RefinedBy<V.Declaration.Constructor<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by t
			readonly $path: K;
		}
	}
	export namespace Field {
		export interface Protected<G extends GrammarMap, K extends Under<'declaration.field.protected'> = 'declaration.field.protected'> extends RefinedBy<V.Declaration.Field<G, K>, V.Modifier.Visibility.Protected<G>> {
			// claimed by t
			readonly $path: K;
		}
		export namespace Signature {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.field.signature.private'> = 'declaration.field.signature.private'> extends RefinedBy<V.Declaration.Field.Signature<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by t
				readonly $path: K;
			}
			export interface Protected<G extends GrammarMap, K extends Under<'declaration.field.signature.protected'> = 'declaration.field.signature.protected'> extends RefinedBy<V.Declaration.Field.Signature<G, K>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.field.signature.public'> = 'declaration.field.signature.public'> extends RefinedBy<V.Declaration.Field.Signature<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by t
				readonly $path: K;
			}
		}
	}
	export namespace Method {
		export interface Protected<G extends GrammarMap, K extends Under<'declaration.method.protected'> = 'declaration.method.protected'> extends RefinedBy<V.Declaration.Method<G, K>, V.Modifier.Visibility.Protected<G>> {
			// claimed by t
			readonly $path: K;
		}
		export namespace Signature {
			export namespace Abstract {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.method.signature.abstract.private'> = 'declaration.method.signature.abstract.private'> extends RefinedBy<V.Declaration.Method.Signature.Abstract<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Protected<G extends GrammarMap, K extends Under<'declaration.method.signature.abstract.protected'> = 'declaration.method.signature.abstract.protected'> extends RefinedBy<V.Declaration.Method.Signature.Abstract<G, K>, V.Modifier.Visibility.Protected<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.method.signature.abstract.public'> = 'declaration.method.signature.abstract.public'> extends RefinedBy<V.Declaration.Method.Signature.Abstract<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by t
					readonly $path: K;
				}
			}
			export interface Protected<G extends GrammarMap, K extends Under<'declaration.method.signature.protected'> = 'declaration.method.signature.protected'> extends RefinedBy<V.Declaration.Method.Signature<G, K>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $path: K;
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
	export namespace Property {
		export namespace Getter {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.property.getter.private'> = 'declaration.property.getter.private'> extends RefinedBy<V.Declaration.Property.Getter<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by t
				readonly $path: K;
			}
			export interface Protected<G extends GrammarMap, K extends Under<'declaration.property.getter.protected'> = 'declaration.property.getter.protected'> extends RefinedBy<V.Declaration.Property.Getter<G, K>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.property.getter.public'> = 'declaration.property.getter.public'> extends RefinedBy<V.Declaration.Property.Getter<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by t
				readonly $path: K;
			}
		}
		export interface Private<G extends GrammarMap, K extends Under<'declaration.property.private'> = 'declaration.property.private'> extends RefinedBy<V.Declaration.Property<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by t
			readonly $path: K;
		}
		export interface Protected<G extends GrammarMap, K extends Under<'declaration.property.protected'> = 'declaration.property.protected'> extends RefinedBy<V.Declaration.Property<G, K>, V.Modifier.Visibility.Protected<G>> {
			// claimed by t
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.property.public'> = 'declaration.property.public'> extends RefinedBy<V.Declaration.Property<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by t
			readonly $path: K;
		}
		export namespace Setter {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.property.setter.private'> = 'declaration.property.setter.private'> extends RefinedBy<V.Declaration.Property.Setter<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by t
				readonly $path: K;
			}
			export interface Protected<G extends GrammarMap, K extends Under<'declaration.property.setter.protected'> = 'declaration.property.setter.protected'> extends RefinedBy<V.Declaration.Property.Setter<G, K>, V.Modifier.Visibility.Protected<G>> {
				// claimed by t
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.property.setter.public'> = 'declaration.property.setter.public'> extends RefinedBy<V.Declaration.Property.Setter<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by t
				readonly $path: K;
			}
		}
		export namespace Signature {
			export namespace Abstract {
				export namespace Getter {
					export interface Private<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract.getter.private'> = 'declaration.property.signature.abstract.getter.private'> extends RefinedBy<V.Declaration.Property.Signature.Abstract.Getter<G, K>, V.Modifier.Visibility.Private<G>> {
						// claimed by t
						readonly $path: K;
					}
					export interface Protected<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract.getter.protected'> = 'declaration.property.signature.abstract.getter.protected'> extends RefinedBy<V.Declaration.Property.Signature.Abstract.Getter<G, K>, V.Modifier.Visibility.Protected<G>> {
						// claimed by t
						readonly $path: K;
					}
					export interface Public<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract.getter.public'> = 'declaration.property.signature.abstract.getter.public'> extends RefinedBy<V.Declaration.Property.Signature.Abstract.Getter<G, K>, V.Modifier.Visibility.Public<G>> {
						// claimed by t
						readonly $path: K;
					}
				}
				export namespace Setter {
					export interface Private<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract.setter.private'> = 'declaration.property.signature.abstract.setter.private'> extends RefinedBy<V.Declaration.Property.Signature.Abstract.Setter<G, K>, V.Modifier.Visibility.Private<G>> {
						// claimed by t
						readonly $path: K;
					}
					export interface Protected<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract.setter.protected'> = 'declaration.property.signature.abstract.setter.protected'> extends RefinedBy<V.Declaration.Property.Signature.Abstract.Setter<G, K>, V.Modifier.Visibility.Protected<G>> {
						// claimed by t
						readonly $path: K;
					}
					export interface Public<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract.setter.public'> = 'declaration.property.signature.abstract.setter.public'> extends RefinedBy<V.Declaration.Property.Signature.Abstract.Setter<G, K>, V.Modifier.Visibility.Public<G>> {
						// claimed by t
						readonly $path: K;
					}
				}
			}
			export namespace Getter {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.property.signature.getter.private'> = 'declaration.property.signature.getter.private'> extends RefinedBy<V.Declaration.Property.Signature.Getter<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Protected<G extends GrammarMap, K extends Under<'declaration.property.signature.getter.protected'> = 'declaration.property.signature.getter.protected'> extends RefinedBy<V.Declaration.Property.Signature.Getter<G, K>, V.Modifier.Visibility.Protected<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.property.signature.getter.public'> = 'declaration.property.signature.getter.public'> extends RefinedBy<V.Declaration.Property.Signature.Getter<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by t
					readonly $path: K;
				}
			}
			export namespace Setter {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.property.signature.setter.private'> = 'declaration.property.signature.setter.private'> extends RefinedBy<V.Declaration.Property.Signature.Setter<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Protected<G extends GrammarMap, K extends Under<'declaration.property.signature.setter.protected'> = 'declaration.property.signature.setter.protected'> extends RefinedBy<V.Declaration.Property.Signature.Setter<G, K>, V.Modifier.Visibility.Protected<G>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.property.signature.setter.public'> = 'declaration.property.signature.setter.public'> extends RefinedBy<V.Declaration.Property.Signature.Setter<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by t
					readonly $path: K;
				}
			}
		}
	}
}
