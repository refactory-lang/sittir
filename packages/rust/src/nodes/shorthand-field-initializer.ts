import type { BuilderTerminal } from '@sittir/types';
import type { ShorthandFieldInitializer, ShorthandFieldInitializerConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function shorthandFieldInitializer(config: ShorthandFieldInitializerConfig): ShorthandFieldInitializer {
  return {
    kind: 'shorthand_field_initializer',
    ...config,
  } as ShorthandFieldInitializer;
}

class ShorthandFieldInitializerBuilder implements BuilderTerminal<ShorthandFieldInitializer> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): ShorthandFieldInitializer {
    return shorthandFieldInitializer({
      children: this._children,
    } as ShorthandFieldInitializerConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function shorthand_field_initializer(children: string[]): ShorthandFieldInitializerBuilder {
  return new ShorthandFieldInitializerBuilder(children);
}
