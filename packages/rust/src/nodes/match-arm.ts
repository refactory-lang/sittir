import type { BuilderTerminal } from '@sittir/types';
import type { MatchArm, MatchArmConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function matchArm(config: MatchArmConfig): MatchArm {
  return {
    kind: 'match_arm',
    ...config,
  } as MatchArm;
}

class MatchArmBuilder implements BuilderTerminal<MatchArm> {
  private _pattern: string = '';
  private _value: string = '';
  private _children: string[] = [];

  constructor(pattern: string) {
    this._pattern = pattern;
  }

  value(value: string): this {
    this._value = value;
    return this;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): MatchArm {
    return matchArm({
      pattern: this._pattern,
      value: this._value,
      children: this._children,
    } as MatchArmConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function match_arm(pattern: string): MatchArmBuilder {
  return new MatchArmBuilder(pattern);
}
