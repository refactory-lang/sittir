import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportSpecifier } from '../types.js';


class ImportSpecifierBuilder extends BaseBuilder<ImportSpecifier> {
  private _alias?: BaseBuilder;
  private _name: BaseBuilder;

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  alias(value: BaseBuilder): this {
    this._alias = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportSpecifier {
    return {
      kind: 'import_specifier',
      alias: this._alias ? this.renderChild(this._alias, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
    } as unknown as ImportSpecifier;
  }

  override get nodeKind(): string { return 'import_specifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    return parts;
  }
}

export function import_specifier(name: BaseBuilder): ImportSpecifierBuilder {
  return new ImportSpecifierBuilder(name);
}
