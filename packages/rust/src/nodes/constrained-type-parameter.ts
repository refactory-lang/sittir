import type { BuilderTerminal } from '@sittir/types';
import type { ConstrainedTypeParameter, ConstrainedTypeParameterConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function constrainedTypeParameter(config: ConstrainedTypeParameterConfig): ConstrainedTypeParameter {
  return {
    kind: 'constrained_type_parameter',
    ...config,
  } as ConstrainedTypeParameter;
}

class ConstrainedTypeParameterBuilder implements BuilderTerminal<ConstrainedTypeParameter> {
  private _bounds: string = '';
  private _left: string = '';

  constructor(bounds: string) {
    this._bounds = bounds;
  }

  left(value: string): this {
    this._left = value;
    return this;
  }

  build(): ConstrainedTypeParameter {
    return constrainedTypeParameter({
      bounds: this._bounds,
      left: this._left,
    } as ConstrainedTypeParameterConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function constrained_type_parameter(bounds: string): ConstrainedTypeParameterBuilder {
  return new ConstrainedTypeParameterBuilder(bounds);
}
