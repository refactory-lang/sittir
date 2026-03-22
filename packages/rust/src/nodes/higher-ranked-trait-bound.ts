import type { BuilderTerminal } from '@sittir/types';
import type { HigherRankedTraitBound, HigherRankedTraitBoundConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function higherRankedTraitBound(config: HigherRankedTraitBoundConfig): HigherRankedTraitBound {
  return {
    kind: 'higher_ranked_trait_bound',
    ...config,
  } as HigherRankedTraitBound;
}

class HigherRankedTraitBoundBuilder implements BuilderTerminal<HigherRankedTraitBound> {
  private _type: string = '';
  private _typeParameters: string = '';

  constructor(type_: string) {
    this._type = type_;
  }

  typeParameters(value: string): this {
    this._typeParameters = value;
    return this;
  }

  build(): HigherRankedTraitBound {
    return higherRankedTraitBound({
      type: this._type,
      typeParameters: this._typeParameters,
    } as HigherRankedTraitBoundConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function higher_ranked_trait_bound(type_: string): HigherRankedTraitBoundBuilder {
  return new HigherRankedTraitBoundBuilder(type_);
}
