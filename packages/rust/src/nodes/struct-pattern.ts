import type { BuilderTerminal } from '@sittir/types';
import type { StructPattern, StructPatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function structPattern(config: StructPatternConfig): StructPattern {
  return {
    kind: 'struct_pattern',
    ...config,
  } as StructPattern;
}

class StructPatternBuilder implements BuilderTerminal<StructPattern> {
  private _type: string = '';
  private _children: string[] = [];

  constructor(type_: string) {
    this._type = type_;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): StructPattern {
    return structPattern({
      type: this._type,
      children: this._children,
    } as StructPatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function struct_pattern(type_: string): StructPatternBuilder {
  return new StructPatternBuilder(type_);
}
