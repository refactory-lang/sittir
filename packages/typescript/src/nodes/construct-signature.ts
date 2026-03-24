import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstructSignature, FormalParameters, TypeAnnotation, TypeParameters } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { formal_parameters } from './formal-parameters.js';
import type { FormalParametersOptions } from './formal-parameters.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';


class ConstructSignatureBuilder extends Builder<ConstructSignature> {
  private _typeParameters?: Builder<TypeParameters>;
  private _parameters: Builder<FormalParameters>;
  private _type?: Builder<TypeAnnotation>;

  constructor(parameters: Builder<FormalParameters>) {
    super();
    this._parameters = parameters;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  type(value: Builder<TypeAnnotation>): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('new');
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConstructSignature {
    return {
      kind: 'construct_signature',
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      parameters: this._parameters.build(ctx),
      type: this._type ? this._type.build(ctx) : undefined,
    } as ConstructSignature;
  }

  override get nodeKind(): 'construct_signature' { return 'construct_signature'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'new', type: 'new' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { ConstructSignatureBuilder };

export function construct_signature(parameters: Builder<FormalParameters>): ConstructSignatureBuilder {
  return new ConstructSignatureBuilder(parameters);
}

export interface ConstructSignatureOptions {
  nodeKind: 'construct_signature';
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  parameters: Builder<FormalParameters> | Omit<FormalParametersOptions, 'nodeKind'>;
  type?: Builder<TypeAnnotation> | Omit<TypeAnnotationOptions, 'nodeKind'>;
}

export namespace construct_signature {
  export function from(options: Omit<ConstructSignatureOptions, 'nodeKind'>): ConstructSignatureBuilder {
    const _ctor = options.parameters;
    const b = new ConstructSignatureBuilder(_ctor instanceof Builder ? _ctor : formal_parameters.from(_ctor));
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v));
    }
    return b;
  }
}
