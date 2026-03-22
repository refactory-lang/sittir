import type { BuilderTerminal } from '@sittir/types';
import type { ScopedTypeIdentifier, ScopedTypeIdentifierConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function scopedTypeIdentifier(config: ScopedTypeIdentifierConfig): ScopedTypeIdentifier {
  return {
    kind: 'scoped_type_identifier',
    ...config,
  } as ScopedTypeIdentifier;
}

class ScopedTypeIdentifierBuilder implements BuilderTerminal<ScopedTypeIdentifier> {
  private _name: string = '';
  private _path?: string;

  constructor(name: string) {
    this._name = name;
  }

  path(value: string): this {
    this._path = value;
    return this;
  }

  build(): ScopedTypeIdentifier {
    return scopedTypeIdentifier({
      name: this._name,
      path: this._path,
    } as ScopedTypeIdentifierConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function scoped_type_identifier(name: string): ScopedTypeIdentifierBuilder {
  return new ScopedTypeIdentifierBuilder(name);
}
