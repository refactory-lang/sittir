import type { BuilderTerminal } from '@sittir/types';
import type { FieldDeclaration, FieldDeclarationConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function fieldDeclaration(config: FieldDeclarationConfig): FieldDeclaration {
  return {
    kind: 'field_declaration',
    ...config,
  } as FieldDeclaration;
}

class FieldBuilder implements BuilderTerminal<FieldDeclaration> {
  private _name: string = '';
  private _type: string = '';
  private _children?: string;

  constructor(name: string) {
    this._name = name;
  }

  type(value: string): this {
    this._type = value;
    return this;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): FieldDeclaration {
    return fieldDeclaration({
      name: this._name,
      type: this._type,
      children: this._children,
    } as FieldDeclarationConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function field(name: string): FieldBuilder {
  return new FieldBuilder(name);
}
