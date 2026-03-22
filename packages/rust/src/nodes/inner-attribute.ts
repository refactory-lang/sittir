import type { BuilderTerminal } from '@sittir/types';
import type { InnerAttributeItem, InnerAttributeItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function innerAttributeItem(config: InnerAttributeItemConfig): InnerAttributeItem {
  return {
    kind: 'inner_attribute_item',
    ...config,
  } as InnerAttributeItem;
}

class InnerAttributeBuilder implements BuilderTerminal<InnerAttributeItem> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): InnerAttributeItem {
    return innerAttributeItem({
      children: this._children,
    } as InnerAttributeItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function inner_attribute(children: string): InnerAttributeBuilder {
  return new InnerAttributeBuilder(children);
}
