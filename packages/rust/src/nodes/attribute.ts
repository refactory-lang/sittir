import type { BuilderTerminal } from '@sittir/types';
import type { Attribute, AttributeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

function createAttribute(config: AttributeConfig): Attribute {
  return {
    kind: 'attribute',
    ...config,
  } as Attribute;
}

class AttributeBuilder implements BuilderTerminal<Attribute> {
  private _arguments?: string;
  private _value?: string;
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  arguments(value: string): this {
    this._arguments = value;
    return this;
  }

  value(value: string): this {
    this._value = value;
    return this;
  }

  build(): Attribute {
    return createAttribute({
      arguments: this._arguments,
      value: this._value,
      children: this._children,
    } as AttributeConfig);
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
