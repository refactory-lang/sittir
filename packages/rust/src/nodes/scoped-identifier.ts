import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ScopedIdentifier } from '../types.js';


class ScopedIdentifierBuilder extends BaseBuilder<ScopedIdentifier> {
  private _name: BaseBuilder;
  private _path?: BaseBuilder;

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  path(value: BaseBuilder): this {
    this._path = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._path) parts.push(this.renderChild(this._path, ctx));
    parts.push('::');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ScopedIdentifier {
    return {
      kind: 'scoped_identifier',
      name: this.renderChild(this._name, ctx),
      path: this._path ? this.renderChild(this._path, ctx) : undefined,
    } as unknown as ScopedIdentifier;
  }

  override get nodeKind(): string { return 'scoped_identifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._path) parts.push({ kind: 'builder', builder: this._path, fieldName: 'path' });
    parts.push({ kind: 'token', text: '::', type: '::' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    return parts;
  }
}

export function scoped_identifier(name: BaseBuilder): ScopedIdentifierBuilder {
  return new ScopedIdentifierBuilder(name);
}
