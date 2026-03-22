import type { BuilderTerminal } from '@sittir/types';
import type { AttributeItem, AttributeItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function attributeItem(config: AttributeItemConfig): AttributeItem {
  return {
    kind: 'attribute_item',
    ...config,
  } as AttributeItem;
}

class AttributeBuilder implements BuilderTerminal<AttributeItem> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): AttributeItem {
    return attributeItem({
      children: this._children,
    } as AttributeItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function attribute(children: string): AttributeBuilder {
  return new AttributeBuilder(children);
}
