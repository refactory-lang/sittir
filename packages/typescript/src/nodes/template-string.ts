import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { EscapeSequence, StringFragment, TemplateString, TemplateSubstitution } from '../types.js';
import { template_substitution } from './template-substitution.js';
import type { TemplateSubstitutionOptions } from './template-substitution.js';


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

  override get nodeKind(): 'template_string' { return 'template_string'; }

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
  nodeKind: 'template_string';
  children?: Builder<StringFragment | EscapeSequence | TemplateSubstitution> | LeafOptions<'string_fragment'> | LeafOptions<'escape_sequence'> | TemplateSubstitutionOptions | (Builder<StringFragment | EscapeSequence | TemplateSubstitution> | LeafOptions<'string_fragment'> | LeafOptions<'escape_sequence'> | TemplateSubstitutionOptions)[];
}

export namespace template_string {
  export function from(input: Omit<TemplateStringOptions, 'nodeKind'> | Builder<StringFragment | EscapeSequence | TemplateSubstitution> | LeafOptions<'string_fragment'> | LeafOptions<'escape_sequence'> | TemplateSubstitutionOptions | (Builder<StringFragment | EscapeSequence | TemplateSubstitution> | LeafOptions<'string_fragment'> | LeafOptions<'escape_sequence'> | TemplateSubstitutionOptions)[]): TemplateStringBuilder {
    const options: Omit<TemplateStringOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TemplateStringOptions, 'nodeKind'>
      : { children: input } as Omit<TemplateStringOptions, 'nodeKind'>;
    const b = new TemplateStringBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'template_substitution': return template_substitution.from(_v);   case 'string_fragment': return new LeafBuilder('string_fragment', (_v as LeafOptions).text!);   case 'escape_sequence': return new LeafBuilder('escape_sequence', (_v as LeafOptions).text!); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
