import type { BuilderTerminal } from '@sittir/types';
import type { UseDeclaration, UseDeclarationConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function useDeclaration(config: UseDeclarationConfig): UseDeclaration {
  return {
    kind: 'use_declaration',
    ...config,
  } as UseDeclaration;
}

class UseBuilder implements BuilderTerminal<UseDeclaration> {
  private _argument: string = '';
  private _children?: string;

  constructor(argument: string) {
    this._argument = argument;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): UseDeclaration {
    return useDeclaration({
      argument: this._argument,
      children: this._children,
    } as UseDeclarationConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function use_(argument: string): UseBuilder {
  return new UseBuilder(argument);
}
