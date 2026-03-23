import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Statement, SwitchDefault } from '../types.js';


class SwitchDefaultBuilder extends Builder<SwitchDefault> {
  private _body: Builder<Statement>;

  constructor(body: Builder<Statement>) {
    super();
    this._body = body;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('default');
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SwitchDefault {
    return {
      kind: 'switch_default',
      body: this._body.build(ctx),
    } as SwitchDefault;
  }

  override get nodeKind(): string { return 'switch_default'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'default', type: 'default' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { SwitchDefaultBuilder };

export function switch_default(body: Builder<Statement>): SwitchDefaultBuilder {
  return new SwitchDefaultBuilder(body);
}

export interface SwitchDefaultOptions {
  body: Builder<Statement>;
}

export namespace switch_default {
  export function from(options: SwitchDefaultOptions): SwitchDefaultBuilder {
    const b = new SwitchDefaultBuilder(options.body);
    return b;
  }
}
