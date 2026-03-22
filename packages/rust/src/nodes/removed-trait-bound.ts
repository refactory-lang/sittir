import type { BuilderTerminal } from '@sittir/types';
import type { RemovedTraitBound, RemovedTraitBoundConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function removedTraitBound(config: RemovedTraitBoundConfig): RemovedTraitBound {
  return {
    kind: 'removed_trait_bound',
    ...config,
  } as RemovedTraitBound;
}

class RemovedTraitBoundBuilder implements BuilderTerminal<RemovedTraitBound> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): RemovedTraitBound {
    return removedTraitBound({
      children: this._children,
    } as RemovedTraitBoundConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function removed_trait_bound(children: string): RemovedTraitBoundBuilder {
  return new RemovedTraitBoundBuilder(children);
}
