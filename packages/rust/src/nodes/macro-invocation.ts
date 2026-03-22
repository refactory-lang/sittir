import type { BuilderTerminal } from '@sittir/types';
import type { MacroInvocation, MacroInvocationConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function macroInvocation(config: MacroInvocationConfig): MacroInvocation {
  return {
    kind: 'macro_invocation',
    ...config,
  } as MacroInvocation;
}

class MacroInvocationBuilder implements BuilderTerminal<MacroInvocation> {
  private _macro: string = '';
  private _children?: string;

  constructor(macro: string) {
    this._macro = macro;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): MacroInvocation {
    return macroInvocation({
      macro: this._macro,
      children: this._children,
    } as MacroInvocationConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function macro_invocation(macro: string): MacroInvocationBuilder {
  return new MacroInvocationBuilder(macro);
}
