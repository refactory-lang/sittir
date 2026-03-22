import type { BuilderTerminal } from '@sittir/types';
import type { Parameter, ParameterConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

function createParameter(config: ParameterConfig): Parameter {
  return {
    kind: 'parameter',
    ...config,
  } as Parameter;
}

class ParameterBuilder implements BuilderTerminal<Parameter> {
  private _pattern: string = '';
  private _type: string = '';
  private _children?: string;

  constructor(pattern: string) {
    this._pattern = pattern;
  }

  type(value: string): this {
    this._type = value;
    return this;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): Parameter {
    return createParameter({
      pattern: this._pattern,
      type: this._type,
      children: this._children,
    } as ParameterConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function parameter(pattern: string): ParameterBuilder {
  return new ParameterBuilder(pattern);
}
