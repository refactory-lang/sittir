import type { BuilderTerminal } from '@sittir/types';
import type { FieldInitializerList, FieldInitializerListConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function fieldInitializerList(config: FieldInitializerListConfig): FieldInitializerList {
  return {
    kind: 'field_initializer_list',
    ...config,
  } as FieldInitializerList;
}

class FieldInitializerListBuilder implements BuilderTerminal<FieldInitializerList> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): FieldInitializerList {
    return fieldInitializerList({
      children: this._children,
    } as FieldInitializerListConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function field_initializer_list(): FieldInitializerListBuilder {
  return new FieldInitializerListBuilder();
}
