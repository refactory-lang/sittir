import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CasePattern, ClassPattern, DottedName } from '../types.js';
import { dotted_name } from './dotted-name.js';
import type { DottedNameOptions } from './dotted-name.js';
import { case_pattern } from './case-pattern.js';
import type { CasePatternOptions } from './case-pattern.js';


class ClassPatternBuilder extends Builder<ClassPattern> {
  private _children: Builder<DottedName | CasePattern>[] = [];

  constructor(...children: Builder<DottedName | CasePattern>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
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

  override get nodeKind(): 'class_pattern' { return 'class_pattern'; }

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

export function class_pattern(...children: Builder<DottedName | CasePattern>[]): ClassPatternBuilder {
  return new ClassPatternBuilder(...children);
}

export interface ClassPatternOptions {
  nodeKind: 'class_pattern';
  children?: Builder<DottedName | CasePattern> | DottedNameOptions | CasePatternOptions | (Builder<DottedName | CasePattern> | DottedNameOptions | CasePatternOptions)[];
}

export namespace class_pattern {
  export function from(input: Omit<ClassPatternOptions, 'nodeKind'> | Builder<DottedName | CasePattern> | DottedNameOptions | CasePatternOptions | (Builder<DottedName | CasePattern> | DottedNameOptions | CasePatternOptions)[]): ClassPatternBuilder {
    const options: Omit<ClassPatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ClassPatternOptions, 'nodeKind'>
      : { children: input } as Omit<ClassPatternOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ClassPatternBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'dotted_name': return dotted_name.from(_v);   case 'case_pattern': return case_pattern.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
