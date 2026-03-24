import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SwitchBody, SwitchCase, SwitchDefault } from '../types.js';
import { switch_case } from './switch-case.js';
import type { SwitchCaseOptions } from './switch-case.js';
import { switch_default } from './switch-default.js';
import type { SwitchDefaultOptions } from './switch-default.js';


class SwitchBodyBuilder extends Builder<SwitchBody> {
  private _children: Builder<SwitchCase | SwitchDefault>[] = [];

  constructor() { super(); }

  children(...value: Builder<SwitchCase | SwitchDefault>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SwitchBody {
    return {
      kind: 'switch_body',
      children: this._children.map(c => c.build(ctx)),
    } as SwitchBody;
  }

  override get nodeKind(): 'switch_body' { return 'switch_body'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { SwitchBodyBuilder };

export function switch_body(): SwitchBodyBuilder {
  return new SwitchBodyBuilder();
}

export interface SwitchBodyOptions {
  nodeKind: 'switch_body';
  children?: Builder<SwitchCase | SwitchDefault> | SwitchCaseOptions | SwitchDefaultOptions | (Builder<SwitchCase | SwitchDefault> | SwitchCaseOptions | SwitchDefaultOptions)[];
}

export namespace switch_body {
  export function from(input: Omit<SwitchBodyOptions, 'nodeKind'> | Builder<SwitchCase | SwitchDefault> | SwitchCaseOptions | SwitchDefaultOptions | (Builder<SwitchCase | SwitchDefault> | SwitchCaseOptions | SwitchDefaultOptions)[]): SwitchBodyBuilder {
    const options: Omit<SwitchBodyOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<SwitchBodyOptions, 'nodeKind'>
      : { children: input } as Omit<SwitchBodyOptions, 'nodeKind'>;
    const b = new SwitchBodyBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'switch_case': return switch_case.from(_v);   case 'switch_default': return switch_default.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
