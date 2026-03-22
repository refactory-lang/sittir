import type { BuilderTerminal } from '@sittir/types';
import type { ScopedUseList, ScopedUseListConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function scopedUseList(config: ScopedUseListConfig): ScopedUseList {
  return {
    kind: 'scoped_use_list',
    ...config,
  } as ScopedUseList;
}

class ScopedUseListBuilder implements BuilderTerminal<ScopedUseList> {
  private _list: string = '';
  private _path?: string;

  constructor(list: string) {
    this._list = list;
  }

  path(value: string): this {
    this._path = value;
    return this;
  }

  build(): ScopedUseList {
    return scopedUseList({
      list: this._list,
      path: this._path,
    } as ScopedUseListConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function scoped_use_list(list: string): ScopedUseListBuilder {
  return new ScopedUseListBuilder(list);
}
