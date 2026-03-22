import type { BuilderTerminal } from '@sittir/types';
import type { ScopedIdentifier, ScopedIdentifierConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function scopedIdentifier(config: ScopedIdentifierConfig): ScopedIdentifier {
  return {
    kind: 'scoped_identifier',
    ...config,
  } as ScopedIdentifier;
}

class ScopedIdentifierBuilder implements BuilderTerminal<ScopedIdentifier> {
  private _name: string = '';
  private _path?: string;

  constructor(name: string) {
    this._name = name;
  }

  path(value: string): this {
    this._path = value;
    return this;
  }

  build(): ScopedIdentifier {
    return scopedIdentifier({
      name: this._name,
      path: this._path,
    } as ScopedIdentifierConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function scoped_identifier(name: string): ScopedIdentifierBuilder {
  return new ScopedIdentifierBuilder(name);
}
