import type { BuilderTerminal } from '@sittir/types';
import type { UseWildcard, UseWildcardConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function useWildcard(config: UseWildcardConfig): UseWildcard {
  return {
    kind: 'use_wildcard',
    ...config,
  } as UseWildcard;
}

class UseWildcardBuilder implements BuilderTerminal<UseWildcard> {
  private _children?: string;

  constructor() {}

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): UseWildcard {
    return useWildcard({
      children: this._children,
    } as UseWildcardConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function use_wildcard(): UseWildcardBuilder {
  return new UseWildcardBuilder();
}
