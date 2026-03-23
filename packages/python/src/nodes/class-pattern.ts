import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CasePattern, ClassPattern, DottedName } from '../types.js';


class ClassPatternBuilder extends Builder<ClassPattern> {
  private _children: Builder<CasePattern | DottedName>[] = [];

  constructor(...children: Builder<CasePattern | DottedName>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push('(');
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClassPattern {
    return {
      kind: 'class_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as ClassPattern;
  }

  override get nodeKind(): string { return 'class_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '(', type: '(' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { ClassPatternBuilder };

export function class_pattern(...children: Builder<CasePattern | DottedName>[]): ClassPatternBuilder {
  return new ClassPatternBuilder(...children);
}

export interface ClassPatternOptions {
  children: Builder<CasePattern | DottedName> | (Builder<CasePattern | DottedName>)[];
}

export namespace class_pattern {
  export function from(options: ClassPatternOptions): ClassPatternBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ClassPatternBuilder(..._arr);
    return b;
  }
}
