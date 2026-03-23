import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldIdentifier, FieldPattern, MutableSpecifier, Pattern, ShorthandFieldIdentifier } from '../types.js';


class FieldPatternBuilder extends Builder<FieldPattern> {
  private _name: Builder;
  private _pattern?: Builder;
  private _children: Builder[] = [];

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  pattern(value: Builder): this {
    this._pattern = value;
    return this;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldPattern {
    return {
      kind: 'field_pattern',
      name: this.renderChild(this._name, ctx),
      pattern: this._pattern ? this.renderChild(this._pattern, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FieldPattern;
  }

  override get nodeKind(): string { return 'field_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    return parts;
  }
}

export type { FieldPatternBuilder };

export function field_pattern(name: Builder): FieldPatternBuilder {
  return new FieldPatternBuilder(name);
}

export interface FieldPatternOptions {
  name: Builder<FieldIdentifier | ShorthandFieldIdentifier>;
  pattern?: Builder<Pattern>;
  children?: Builder<MutableSpecifier> | string | (Builder<MutableSpecifier> | string)[];
}

export namespace field_pattern {
  export function from(options: FieldPatternOptions): FieldPatternBuilder {
    const b = new FieldPatternBuilder(options.name);
    if (options.pattern !== undefined) b.pattern(options.pattern);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('mutable_specifier', _x) : _x));
    }
    return b;
  }
}
