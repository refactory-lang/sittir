import type { BuilderTerminal } from '@sittir/types';
import type { ExternModifier, ExternModifierConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function externModifier(config: ExternModifierConfig): ExternModifier {
  return {
    kind: 'extern_modifier',
    ...config,
  } as ExternModifier;
}

class ExternModifierBuilder implements BuilderTerminal<ExternModifier> {
  private _children?: string;

  constructor() {}

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): ExternModifier {
    return externModifier({
      children: this._children,
    } as ExternModifierConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function extern_modifier(): ExternModifierBuilder {
  return new ExternModifierBuilder();
}
