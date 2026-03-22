import type { BuilderTerminal } from '@sittir/types';
import type { DynamicType, DynamicTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function dynamicType(config: DynamicTypeConfig): DynamicType {
  return {
    kind: 'dynamic_type',
    ...config,
  } as DynamicType;
}

class DynamicTypeBuilder implements BuilderTerminal<DynamicType> {
  private _trait: string = '';

  constructor(trait: string) {
    this._trait = trait;
  }

  build(): DynamicType {
    return dynamicType({
      trait: this._trait,
    } as DynamicTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function dynamic_type(trait: string): DynamicTypeBuilder {
  return new DynamicTypeBuilder(trait);
}
