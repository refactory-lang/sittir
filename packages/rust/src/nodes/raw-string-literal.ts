import type { BuilderTerminal } from '@sittir/types';
import type { RawStringLiteral, RawStringLiteralConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function rawStringLiteral(config: RawStringLiteralConfig): RawStringLiteral {
  return {
    kind: 'raw_string_literal',
    ...config,
  } as RawStringLiteral;
}

class RawStringLiteralBuilder implements BuilderTerminal<RawStringLiteral> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): RawStringLiteral {
    return rawStringLiteral({
      children: this._children,
    } as RawStringLiteralConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function raw_string_literal(children: string): RawStringLiteralBuilder {
  return new RawStringLiteralBuilder(children);
}
