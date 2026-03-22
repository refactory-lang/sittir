import type { BuilderTerminal } from '@sittir/types';
import type { ConstParameter, ConstParameterConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function constParameter(config: ConstParameterConfig): ConstParameter {
  return {
    kind: 'const_parameter',
    ...config,
  } as ConstParameter;
}

class ConstParameterBuilder implements BuilderTerminal<ConstParameter> {
  private _name: string = '';
  private _type: string = '';

  constructor(name: string) {
    this._name = name;
  }

  type(value: string): this {
    this._type = value;
    return this;
  }

  build(): ConstParameter {
    return constParameter({
      name: this._name,
      type: this._type,
    } as ConstParameterConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function const_parameter(name: string): ConstParameterBuilder {
  return new ConstParameterBuilder(name);
}
