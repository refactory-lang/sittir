import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LabeledStatement } from '../types.js';


class LabeledStatementBuilder extends Builder<LabeledStatement> {

  constructor() { super(); }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LabeledStatement {
    return {
      kind: 'labeled_statement',
    } as LabeledStatement;
  }

  override get nodeKind(): string { return 'labeled_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    return parts;
  }
}

export type { LabeledStatementBuilder };

export function labeled_statement(): LabeledStatementBuilder {
  return new LabeledStatementBuilder();
}

export interface LabeledStatementOptions {
}

export namespace labeled_statement {
  export function from(options: LabeledStatementOptions): LabeledStatementBuilder {
    const b = new LabeledStatementBuilder();
    return b;
  }
}
