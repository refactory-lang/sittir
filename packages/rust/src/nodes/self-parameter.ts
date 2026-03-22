import type { BuilderTerminal } from '@sittir/types';
import type { SelfParameter, SelfParameterConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function selfParameter(config: SelfParameterConfig): SelfParameter {
  return {
    kind: 'self_parameter',
    ...config,
  } as SelfParameter;
}

class SelfParameterBuilder implements BuilderTerminal<SelfParameter> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): SelfParameter {
    return selfParameter({
      children: this._children,
    } as SelfParameterConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function self_parameter(children: string[]): SelfParameterBuilder {
  return new SelfParameterBuilder(children);
}
