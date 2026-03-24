import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BreakStatement, StatementIdentifier } from '../types.js';


class BreakStatementBuilder extends Builder<BreakStatement> {
  private _label?: Builder<StatementIdentifier>;

  constructor() { super(); }

  label(value: Builder<StatementIdentifier>): this {
    this._label = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('break');
    if (this._label) parts.push(this.renderChild(this._label, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BreakStatement {
    return {
      kind: 'break_statement',
      label: this._label ? this._label.build(ctx) : undefined,
    } as BreakStatement;
  }

  override get nodeKind(): 'break_statement' { return 'break_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'break', type: 'break' });
    if (this._label) parts.push({ kind: 'builder', builder: this._label, fieldName: 'label' });
    return parts;
  }
}

export type { BreakStatementBuilder };

export function break_statement(): BreakStatementBuilder {
  return new BreakStatementBuilder();
}

export interface BreakStatementOptions {
  nodeKind: 'break_statement';
  label?: Builder<StatementIdentifier> | string;
}

export namespace break_statement {
  export function from(input: Omit<BreakStatementOptions, 'nodeKind'> | Builder<StatementIdentifier> | string): BreakStatementBuilder {
    const options: Omit<BreakStatementOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'label' in input
      ? input as Omit<BreakStatementOptions, 'nodeKind'>
      : { label: input } as Omit<BreakStatementOptions, 'nodeKind'>;
    const b = new BreakStatementBuilder();
    if (options.label !== undefined) {
      const _v = options.label;
      b.label(typeof _v === 'string' ? new LeafBuilder('statement_identifier', _v) : _v);
    }
    return b;
  }
}
