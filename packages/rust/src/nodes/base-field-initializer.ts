import type { BuilderTerminal } from '@sittir/types';
import type { BaseFieldInitializer, BaseFieldInitializerConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function baseFieldInitializer(config: BaseFieldInitializerConfig): BaseFieldInitializer {
  return {
    kind: 'base_field_initializer',
    ...config,
  } as BaseFieldInitializer;
}

class BaseFieldInitializerBuilder implements BuilderTerminal<BaseFieldInitializer> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): BaseFieldInitializer {
    return baseFieldInitializer({
      children: this._children,
    } as BaseFieldInitializerConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function base_field_initializer(children: string): BaseFieldInitializerBuilder {
  return new BaseFieldInitializerBuilder(children);
}
