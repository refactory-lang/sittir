import type { BuilderTerminal } from '@sittir/types';
import type { ForLifetimes, ForLifetimesConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function forLifetimes(config: ForLifetimesConfig): ForLifetimes {
  return {
    kind: 'for_lifetimes',
    ...config,
  } as ForLifetimes;
}

class ForLifetimesBuilder implements BuilderTerminal<ForLifetimes> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): ForLifetimes {
    return forLifetimes({
      children: this._children,
    } as ForLifetimesConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function for_lifetimes(children: string[]): ForLifetimesBuilder {
  return new ForLifetimesBuilder(children);
}
