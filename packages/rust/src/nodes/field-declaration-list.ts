import type { BuilderTerminal } from '@sittir/types';
import type { FieldDeclarationList, FieldDeclarationListConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function fieldDeclarationList(config: FieldDeclarationListConfig): FieldDeclarationList {
  return {
    kind: 'field_declaration_list',
    ...config,
  } as FieldDeclarationList;
}

class FieldDeclarationListBuilder implements BuilderTerminal<FieldDeclarationList> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): FieldDeclarationList {
    return fieldDeclarationList({
      children: this._children,
    } as FieldDeclarationListConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function field_declaration_list(): FieldDeclarationListBuilder {
  return new FieldDeclarationListBuilder();
}
