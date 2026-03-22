import type { BuilderTerminal } from '@sittir/types';
import type { MacroRule, MacroRuleConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function macroRule(config: MacroRuleConfig): MacroRule {
  return {
    kind: 'macro_rule',
    ...config,
  } as MacroRule;
}

class MacroRuleBuilder implements BuilderTerminal<MacroRule> {
  private _left: string = '';
  private _right: string = '';

  constructor(left: string) {
    this._left = left;
  }

  right(value: string): this {
    this._right = value;
    return this;
  }

  build(): MacroRule {
    return macroRule({
      left: this._left,
      right: this._right,
    } as MacroRuleConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function macro_rule(left: string): MacroRuleBuilder {
  return new MacroRuleBuilder(left);
}
