import type { BuilderTerminal } from '@sittir/types';
import type { Label, LabelConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

function createLabel(config: LabelConfig): Label {
  return {
    kind: 'label',
    ...config,
  } as Label;
}

class LabelBuilder implements BuilderTerminal<Label> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): Label {
    return createLabel({
      children: this._children,
    } as LabelConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function label(children: string): LabelBuilder {
  return new LabelBuilder(children);
}
