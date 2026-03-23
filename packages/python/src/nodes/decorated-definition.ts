import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClassDefinition, DecoratedDefinition, Decorator, FunctionDefinition } from '../types.js';


class DecoratedDefinitionBuilder extends Builder<DecoratedDefinition> {
  private _definition: Builder<ClassDefinition | FunctionDefinition>;
  private _children: Builder<Decorator>[] = [];

  constructor(definition: Builder<ClassDefinition | FunctionDefinition>) {
    super();
    this._definition = definition;
  }

  children(...value: Builder<Decorator>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._definition) parts.push(this.renderChild(this._definition, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DecoratedDefinition {
    return {
      kind: 'decorated_definition',
      definition: this._definition.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as DecoratedDefinition;
  }

  override get nodeKind(): string { return 'decorated_definition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._definition) parts.push({ kind: 'builder', builder: this._definition, fieldName: 'definition' });
    return parts;
  }
}

export type { DecoratedDefinitionBuilder };

export function decorated_definition(definition: Builder<ClassDefinition | FunctionDefinition>): DecoratedDefinitionBuilder {
  return new DecoratedDefinitionBuilder(definition);
}

export interface DecoratedDefinitionOptions {
  definition: Builder<ClassDefinition | FunctionDefinition>;
  children?: Builder<Decorator> | (Builder<Decorator>)[];
}

export namespace decorated_definition {
  export function from(options: DecoratedDefinitionOptions): DecoratedDefinitionBuilder {
    const b = new DecoratedDefinitionBuilder(options.definition);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
