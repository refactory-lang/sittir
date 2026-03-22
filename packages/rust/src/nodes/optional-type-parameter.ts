import type { BuilderTerminal } from '@sittir/types';
import type { OptionalTypeParameter, OptionalTypeParameterConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function optionalTypeParameter(config: OptionalTypeParameterConfig): OptionalTypeParameter {
  return {
    kind: 'optional_type_parameter',
    ...config,
  } as OptionalTypeParameter;
}

class OptionalTypeParameterBuilder implements BuilderTerminal<OptionalTypeParameter> {
  private _defaultType: string = '';
  private _name: string = '';

  constructor(name: string) {
    this._name = name;
  }

  defaultType(value: string): this {
    this._defaultType = value;
    return this;
  }

  build(): OptionalTypeParameter {
    return optionalTypeParameter({
      defaultType: this._defaultType,
      name: this._name,
    } as OptionalTypeParameterConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function optional_type_parameter(name: string): OptionalTypeParameterBuilder {
  return new OptionalTypeParameterBuilder(name);
}
