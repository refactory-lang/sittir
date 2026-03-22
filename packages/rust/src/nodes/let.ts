import type { BuilderTerminal } from '@sittir/types';
import type { LetDeclaration, LetDeclarationConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function letDeclaration(config: LetDeclarationConfig): LetDeclaration {
  return {
    kind: 'let_declaration',
    ...config,
  } as LetDeclaration;
}

class LetBuilder implements BuilderTerminal<LetDeclaration> {
  private _alternative?: string;
  private _pattern: string = '';
  private _type?: string;
  private _value?: string;
  private _children?: string;

  constructor(pattern: string) {
    this._pattern = pattern;
  }

  alternative(value: string): this {
    this._alternative = value;
    return this;
  }

  type(value: string): this {
    this._type = value;
    return this;
  }

  value(value: string): this {
    this._value = value;
    return this;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): LetDeclaration {
    return letDeclaration({
      alternative: this._alternative,
      pattern: this._pattern,
      type: this._type,
      value: this._value,
      children: this._children,
    } as LetDeclarationConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function let_(pattern: string): LetBuilder {
  return new LetBuilder(pattern);
}
