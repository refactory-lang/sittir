import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallSignature, ConstructSignature, ExportStatement, IndexSignature, MethodSignature, ObjectType, PropertySignature } from '../types.js';
import { export_statement } from './export-statement.js';
import type { ExportStatementOptions } from './export-statement.js';
import { property_signature } from './property-signature.js';
import type { PropertySignatureOptions } from './property-signature.js';
import { call_signature } from './call-signature.js';
import type { CallSignatureOptions } from './call-signature.js';
import { construct_signature } from './construct-signature.js';
import type { ConstructSignatureOptions } from './construct-signature.js';
import { index_signature } from './index-signature.js';
import type { IndexSignatureOptions } from './index-signature.js';
import { method_signature } from './method-signature.js';
import type { MethodSignatureOptions } from './method-signature.js';


class ObjectTypeBuilder extends Builder<ObjectType> {
  private _children: Builder<ExportStatement | PropertySignature | CallSignature | ConstructSignature | IndexSignature | MethodSignature>[] = [];

  constructor() { super(); }

  children(...value: Builder<ExportStatement | PropertySignature | CallSignature | ConstructSignature | IndexSignature | MethodSignature>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ObjectType {
    return {
      kind: 'object_type',
      children: this._children.map(c => c.build(ctx)),
    } as ObjectType;
  }

  override get nodeKind(): 'object_type' { return 'object_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { ObjectTypeBuilder };

export function object_type(): ObjectTypeBuilder {
  return new ObjectTypeBuilder();
}

export interface ObjectTypeOptions {
  nodeKind: 'object_type';
  children?: Builder<ExportStatement | PropertySignature | CallSignature | ConstructSignature | IndexSignature | MethodSignature> | ExportStatementOptions | PropertySignatureOptions | CallSignatureOptions | ConstructSignatureOptions | IndexSignatureOptions | MethodSignatureOptions | (Builder<ExportStatement | PropertySignature | CallSignature | ConstructSignature | IndexSignature | MethodSignature> | ExportStatementOptions | PropertySignatureOptions | CallSignatureOptions | ConstructSignatureOptions | IndexSignatureOptions | MethodSignatureOptions)[];
}

export namespace object_type {
  export function from(input: Omit<ObjectTypeOptions, 'nodeKind'> | Builder<ExportStatement | PropertySignature | CallSignature | ConstructSignature | IndexSignature | MethodSignature> | ExportStatementOptions | PropertySignatureOptions | CallSignatureOptions | ConstructSignatureOptions | IndexSignatureOptions | MethodSignatureOptions | (Builder<ExportStatement | PropertySignature | CallSignature | ConstructSignature | IndexSignature | MethodSignature> | ExportStatementOptions | PropertySignatureOptions | CallSignatureOptions | ConstructSignatureOptions | IndexSignatureOptions | MethodSignatureOptions)[]): ObjectTypeBuilder {
    const options: Omit<ObjectTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ObjectTypeOptions, 'nodeKind'>
      : { children: input } as Omit<ObjectTypeOptions, 'nodeKind'>;
    const b = new ObjectTypeBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'export_statement': return export_statement.from(_v);   case 'property_signature': return property_signature.from(_v);   case 'call_signature': return call_signature.from(_v);   case 'construct_signature': return construct_signature.from(_v);   case 'index_signature': return index_signature.from(_v);   case 'method_signature': return method_signature.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
