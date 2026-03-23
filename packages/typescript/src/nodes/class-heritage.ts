import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClassHeritage, ExtendsClause, ImplementsClause } from '../types.js';


class ClassHeritageBuilder extends Builder<ClassHeritage> {
  private _children: Builder<ExtendsClause | ImplementsClause>[] = [];

  constructor(...children: Builder<ExtendsClause | ImplementsClause>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClassHeritage {
    return {
      kind: 'class_heritage',
      children: this._children.map(c => c.build(ctx)),
    } as ClassHeritage;
  }

  override get nodeKind(): string { return 'class_heritage'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ClassHeritageBuilder };

export function class_heritage(...children: Builder<ExtendsClause | ImplementsClause>[]): ClassHeritageBuilder {
  return new ClassHeritageBuilder(...children);
}

export interface ClassHeritageOptions {
  children?: Builder<ExtendsClause | ImplementsClause> | (Builder<ExtendsClause | ImplementsClause>)[];
}

export namespace class_heritage {
  export function from(options: ClassHeritageOptions): ClassHeritageBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ClassHeritageBuilder(..._arr);
    return b;
  }
}
