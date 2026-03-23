import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ScopedTypeIdentifier } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ScopedTypeIdentifierBuilder extends BaseBuilder<ScopedTypeIdentifier> {
  private _name: Child;
  private _path?: Child;

  constructor(name: Child) {
    super();
    this._name = name;
  }

  path(value: Child): this {
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

  build(ctx?: RenderContext): ScopedTypeIdentifier {
    return {
      kind: 'scoped_type_identifier',
      name: this.renderChild(this._name, ctx),
      path: this._path ? this.renderChild(this._path, ctx) : undefined,
    } as unknown as ScopedTypeIdentifier;
  }

  override get nodeKind(): string { return 'scoped_type_identifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._path) parts.push({ kind: 'builder', builder: this._path, fieldName: 'path' });
    parts.push({ kind: 'token', text: '::', type: '::' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    return parts;
  }
}

export function scoped_type_identifier(name: Child): ScopedTypeIdentifierBuilder {
  return new ScopedTypeIdentifierBuilder(name);
}
