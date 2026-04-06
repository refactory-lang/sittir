import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Parameter } from '../types.js';


class ParameterBuilder extends BaseBuilder<Parameter> {
  private _pattern: BaseBuilder;
  private _type!: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(pattern: BaseBuilder) {
    super();
    this._pattern = pattern;
  }

  type(value: BaseBuilder): this {
    this._type = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    parts.push(':');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Parameter {
    return {
      kind: 'parameter',
      pattern: this.renderChild(this._pattern, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as Parameter;
  }

  override get nodeKind(): string { return 'parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export function parameter(pattern: BaseBuilder): ParameterBuilder {
  return new ParameterBuilder(pattern);
}
