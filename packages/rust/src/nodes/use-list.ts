import type { BuilderTerminal } from '@sittir/types';
import type { UseList, UseListConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function useList(config: UseListConfig): UseList {
  return {
    kind: 'use_list',
    ...config,
  } as UseList;
}

class UseListBuilder implements BuilderTerminal<UseList> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): UseList {
    return useList({
      children: this._children,
    } as UseListConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function use_list(): UseListBuilder {
  return new UseListBuilder();
}
