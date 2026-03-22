import type { BuilderTerminal } from '@sittir/types';
import type { BoundedType, BoundedTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function boundedType(config: BoundedTypeConfig): BoundedType {
  return {
    kind: 'bounded_type',
    ...config,
  } as BoundedType;
}

class BoundedTypeBuilder implements BuilderTerminal<BoundedType> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): BoundedType {
    return boundedType({
      children: this._children,
    } as BoundedTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function bounded_type(children: string[]): BoundedTypeBuilder {
  return new BoundedTypeBuilder(children);
}
