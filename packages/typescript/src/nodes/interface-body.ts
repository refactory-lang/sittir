import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallSignature, ConstructSignature, ExportStatement, IndexSignature, InterfaceBody, MethodSignature, PropertySignature } from '../types.js';
import { call_signature } from './call-signature.js';
import type { CallSignatureOptions } from './call-signature.js';
import { construct_signature } from './construct-signature.js';
import type { ConstructSignatureOptions } from './construct-signature.js';
import { export_statement } from './export-statement.js';
import type { ExportStatementOptions } from './export-statement.js';
import { index_signature } from './index-signature.js';
import type { IndexSignatureOptions } from './index-signature.js';
import { method_signature } from './method-signature.js';
import type { MethodSignatureOptions } from './method-signature.js';
import { property_signature } from './property-signature.js';
import type { PropertySignatureOptions } from './property-signature.js';


class InterfaceBodyBuilder extends Builder<InterfaceBody> {
  private _children: Builder<CallSignature | ConstructSignature | ExportStatement | IndexSignature | MethodSignature | PropertySignature>[] = [];

  constructor() { super(); }

  children(...value: Builder<CallSignature | ConstructSignature | ExportStatement | IndexSignature | MethodSignature | PropertySignature>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): InterfaceBody {
    return {
      kind: 'interface_body',
      children: this._children.map(c => c.build(ctx)),
    } as InterfaceBody;
  }

  override get nodeKind(): 'interface_body' { return 'interface_body'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { InterfaceBodyBuilder };

export function interface_body(): InterfaceBodyBuilder {
  return new InterfaceBodyBuilder();
}

export interface InterfaceBodyOptions {
  nodeKind: 'interface_body';
  children?: Builder<CallSignature | ConstructSignature | ExportStatement | IndexSignature | MethodSignature | PropertySignature> | CallSignatureOptions | ConstructSignatureOptions | ExportStatementOptions | IndexSignatureOptions | MethodSignatureOptions | PropertySignatureOptions | (Builder<CallSignature | ConstructSignature | ExportStatement | IndexSignature | MethodSignature | PropertySignature> | CallSignatureOptions | ConstructSignatureOptions | ExportStatementOptions | IndexSignatureOptions | MethodSignatureOptions | PropertySignatureOptions)[];
}

export namespace interface_body {
  export function from(input: Omit<InterfaceBodyOptions, 'nodeKind'> | Builder<CallSignature | ConstructSignature | ExportStatement | IndexSignature | MethodSignature | PropertySignature> | CallSignatureOptions | ConstructSignatureOptions | ExportStatementOptions | IndexSignatureOptions | MethodSignatureOptions | PropertySignatureOptions | (Builder<CallSignature | ConstructSignature | ExportStatement | IndexSignature | MethodSignature | PropertySignature> | CallSignatureOptions | ConstructSignatureOptions | ExportStatementOptions | IndexSignatureOptions | MethodSignatureOptions | PropertySignatureOptions)[]): InterfaceBodyBuilder {
    const options: Omit<InterfaceBodyOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<InterfaceBodyOptions, 'nodeKind'>
      : { children: input } as Omit<InterfaceBodyOptions, 'nodeKind'>;
    const b = new InterfaceBodyBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'call_signature': return call_signature.from(_v);   case 'construct_signature': return construct_signature.from(_v);   case 'export_statement': return export_statement.from(_v);   case 'index_signature': return index_signature.from(_v);   case 'method_signature': return method_signature.from(_v);   case 'property_signature': return property_signature.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
