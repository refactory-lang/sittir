import type { BuilderTerminal } from '@sittir/types';
import type { VisibilityModifier, VisibilityModifierConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function visibilityModifier(config: VisibilityModifierConfig): VisibilityModifier {
  return {
    kind: 'visibility_modifier',
    ...config,
  } as VisibilityModifier;
}

class VisibilityModifierBuilder implements BuilderTerminal<VisibilityModifier> {
  private _children?: string;

  constructor() {}

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): VisibilityModifier {
    return visibilityModifier({
      children: this._children,
    } as VisibilityModifierConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function visibility_modifier(): VisibilityModifierBuilder {
  return new VisibilityModifierBuilder();
}
