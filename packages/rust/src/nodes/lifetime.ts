import type { BuilderTerminal } from '@sittir/types';
import type { Lifetime, LifetimeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

function createLifetime(config: LifetimeConfig): Lifetime {
  return {
    kind: 'lifetime',
    ...config,
  } as Lifetime;
}

class LifetimeBuilder implements BuilderTerminal<Lifetime> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): Lifetime {
    return createLifetime({
      children: this._children,
    } as LifetimeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function lifetime(children: string): LifetimeBuilder {
  return new LifetimeBuilder(children);
}
