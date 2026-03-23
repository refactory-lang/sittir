import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExportSpecifier } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ExportSpecifierBuilder extends BaseBuilder<ExportSpecifier> {
  private _alias?: Child;
  private _name: Child;

  constructor(name: Child) {
    super();
    this._name = name;
  }

  alias(value: Child): this {
    this._alias = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExportSpecifier {
    return {
      kind: 'export_specifier',
      alias: this._alias ? this.renderChild(this._alias, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
    } as unknown as ExportSpecifier;
  }

  override get nodeKind(): string { return 'export_specifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    return parts;
  }
}

export function export_specifier(name: Child): ExportSpecifierBuilder {
  return new ExportSpecifierBuilder(name);
}
