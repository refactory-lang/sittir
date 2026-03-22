import type { BuilderTerminal } from '@sittir/types';
import type { MacroDefinition, MacroDefinitionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function macroDefinition(config: MacroDefinitionConfig): MacroDefinition {
  return {
    kind: 'macro_definition',
    ...config,
  } as MacroDefinition;
}

class MacroDefinitionBuilder implements BuilderTerminal<MacroDefinition> {
  private _name: string = '';
  private _children: string[] = [];

  constructor(name: string) {
    this._name = name;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): MacroDefinition {
    return macroDefinition({
      name: this._name,
      children: this._children,
    } as MacroDefinitionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function macro_definition(name: string): MacroDefinitionBuilder {
  return new MacroDefinitionBuilder(name);
}
