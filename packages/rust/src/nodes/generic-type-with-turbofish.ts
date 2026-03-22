import type { BuilderTerminal } from '@sittir/types';
import type { GenericTypeWithTurbofish, GenericTypeWithTurbofishConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function genericTypeWithTurbofish(config: GenericTypeWithTurbofishConfig): GenericTypeWithTurbofish {
  return {
    kind: 'generic_type_with_turbofish',
    ...config,
  } as GenericTypeWithTurbofish;
}

class GenericTypeWithTurbofishBuilder implements BuilderTerminal<GenericTypeWithTurbofish> {
  private _type: string = '';
  private _typeArguments: string = '';

  constructor(type_: string) {
    this._type = type_;
  }

  typeArguments(value: string): this {
    this._typeArguments = value;
    return this;
  }

  build(): GenericTypeWithTurbofish {
    return genericTypeWithTurbofish({
      type: this._type,
      typeArguments: this._typeArguments,
    } as GenericTypeWithTurbofishConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function generic_type_with_turbofish(type_: string): GenericTypeWithTurbofishBuilder {
  return new GenericTypeWithTurbofishBuilder(type_);
}
