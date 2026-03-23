import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EscapeSequence, StringFragment, TemplateString, TemplateSubstitution } from '../types.js';


class TemplateStringBuilder extends Builder<TemplateString> {
  private _children: Builder<StringFragment | EscapeSequence | TemplateSubstitution>[] = [];

  constructor() { super(); }

  children(...value: Builder<StringFragment | EscapeSequence | TemplateSubstitution>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('`');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('`');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TemplateString {
    return {
      kind: 'template_string',
      children: this._children.map(c => c.build(ctx)),
    } as TemplateString;
  }

  override get nodeKind(): string { return 'template_string'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '`', type: '`' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '`', type: '`' });
    return parts;
  }
}

export type { TemplateStringBuilder };

export function template_string(): TemplateStringBuilder {
  return new TemplateStringBuilder();
}

export interface TemplateStringOptions {
  children?: Builder<StringFragment | EscapeSequence | TemplateSubstitution> | (Builder<StringFragment | EscapeSequence | TemplateSubstitution>)[];
}

export namespace template_string {
  export function from(options: TemplateStringOptions): TemplateStringBuilder {
    const b = new TemplateStringBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
