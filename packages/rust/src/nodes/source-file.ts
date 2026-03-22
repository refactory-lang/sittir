import type { BuilderTerminal } from '@sittir/types';
import type { SourceFile, SourceFileConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function sourceFile(config: SourceFileConfig): SourceFile {
  return {
    kind: 'source_file',
    ...config,
  } as SourceFile;
}

class SourceFileBuilder implements BuilderTerminal<SourceFile> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): SourceFile {
    return sourceFile({
      children: this._children,
    } as SourceFileConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function file(): SourceFileBuilder {
  return new SourceFileBuilder();
}
