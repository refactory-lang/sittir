import type { BuilderTerminal } from '@sittir/types';
import type { AbstractType, AbstractTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function abstractType(config: AbstractTypeConfig): AbstractType {
  return {
    kind: 'abstract_type',
    ...config,
  } as AbstractType;
}

class AbstractTypeBuilder implements BuilderTerminal<AbstractType> {
  private _trait: string = '';
  private _children?: string;

  constructor(trait: string) {
    this._trait = trait;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): AbstractType {
    return abstractType({
      trait: this._trait,
      children: this._children,
    } as AbstractTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function abstract_type(trait: string): AbstractTypeBuilder {
  return new AbstractTypeBuilder(trait);
}
