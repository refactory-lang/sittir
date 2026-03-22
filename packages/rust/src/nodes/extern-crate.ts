import type { BuilderTerminal } from '@sittir/types';
import type { ExternCrateDeclaration, ExternCrateDeclarationConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function externCrateDeclaration(config: ExternCrateDeclarationConfig): ExternCrateDeclaration {
  return {
    kind: 'extern_crate_declaration',
    ...config,
  } as ExternCrateDeclaration;
}

class ExternCrateBuilder implements BuilderTerminal<ExternCrateDeclaration> {
  private _alias?: string;
  private _name: string = '';
  private _children: string[] = [];

  constructor(name: string) {
    this._name = name;
  }

  alias(value: string): this {
    this._alias = value;
    return this;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): ExternCrateDeclaration {
    return externCrateDeclaration({
      alias: this._alias,
      name: this._name,
      children: this._children,
    } as ExternCrateDeclarationConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function extern_crate(name: string): ExternCrateBuilder {
  return new ExternCrateBuilder(name);
}
