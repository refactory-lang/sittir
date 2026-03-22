import type { BuilderTerminal } from '@sittir/types';
import type { StringLiteral, StringLiteralConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function stringLiteral(config: StringLiteralConfig): StringLiteral {
  return {
    kind: 'string_literal',
    ...config,
  } as StringLiteral;
}

class StringLiteralBuilder implements BuilderTerminal<StringLiteral> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): StringLiteral {
    return stringLiteral({
      children: this._children,
    } as StringLiteralConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function string_literal(): StringLiteralBuilder {
  return new StringLiteralBuilder();
}
