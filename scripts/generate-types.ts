#!/usr/bin/env tsx

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

interface ProtoEnum {
  name: string;
  values: { name: string; value: number }[];
}

interface ProtoField {
  name: string;
  type: string;
  number: number;
  optional?: boolean;
  repeated?: boolean;
}

interface ProtoMessage {
  name: string;
  fields: ProtoField[];
}

interface ProtoMethod {
  name: string;
  request: string;
  response: string;
}

interface ProtoService {
  name: string;
  methods: ProtoMethod[];
}

class ProtoParser {
  private protoContent: string;

  constructor(protoContent: string) {
    this.protoContent = protoContent;
  }

  parseEnums(): ProtoEnum[] {
    const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
    const enums: ProtoEnum[] = [];
    let match;

    while ((match = enumRegex.exec(this.protoContent)) !== null) {
      const enumName = match[1];
      const enumBody = match[2];
      
      const valueRegex = /(\w+)\s*=\s*(\d+);/g;
      const values: { name: string; value: number }[] = [];
      let valueMatch;

      while ((valueMatch = valueRegex.exec(enumBody)) !== null) {
        values.push({
          name: valueMatch[1],
          value: parseInt(valueMatch[2])
        });
      }

      enums.push({ name: enumName, values });
    }

    return enums;
  }

  parseMessages(): ProtoMessage[] {
    const messageRegex = /message\s+(\w+)\s*\{([^}]+)\}/g;
    const messages: ProtoMessage[] = [];
    let match;

    while ((match = messageRegex.exec(this.protoContent)) !== null) {
      const messageName = match[1];
      const messageBody = match[2];
      
      const fieldRegex = /(optional\s+|repeated\s+)?(\w+(?:\.\w+)*(?:\.\w+)*)\s+(\w+)\s*=\s*(\d+);/g;
      const fields: ProtoField[] = [];
      let fieldMatch;

      while ((fieldMatch = fieldRegex.exec(messageBody)) !== null) {
        const modifier = fieldMatch[1]?.trim();
        const type = fieldMatch[2];
        const name = fieldMatch[3];
        const number = parseInt(fieldMatch[4]);

        fields.push({
          name,
          type: this.mapProtoTypeToTypescript(type),
          number,
          optional: modifier === 'optional',
          repeated: modifier === 'repeated'
        });
      }

      messages.push({ name: messageName, fields });
    }

    return messages;
  }

  parseServices(): ProtoService[] {
    const serviceRegex = /service\s+(\w+)\s*\{([^}]+)\}/g;
    const services: ProtoService[] = [];
    let match;

    while ((match = serviceRegex.exec(this.protoContent)) !== null) {
      const serviceName = match[1];
      const serviceBody = match[2];
      
      const rpcRegex = /rpc\s+(\w+)\s*\(([^)]+)\)\s*returns\s*\(([^)]+)\);/g;
      const methods: ProtoMethod[] = [];
      let rpcMatch;

      while ((rpcMatch = rpcRegex.exec(serviceBody)) !== null) {
        methods.push({
          name: rpcMatch[1],
          request: rpcMatch[2],
          response: rpcMatch[3]
        });
      }

      services.push({ name: serviceName, methods });
    }

    return services;
  }

  private mapProtoTypeToTypescript(protoType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'int32': 'number',
      'int64': 'number',
      'uint32': 'number',
      'uint64': 'number',
      'float': 'number',
      'double': 'number',
      'bool': 'boolean',
      'bytes': 'Uint8Array',
      'google.protobuf.Struct': 'Record<string, any>'
    };

    return typeMap[protoType] || protoType;
  }
}

class TypeScriptGenerator {
  generateEnum(protoEnum: ProtoEnum): string {
    const values = protoEnum.values
      .map(v => `  ${v.name} = ${v.value}`)
      .join(',\n');

    return `export enum ${protoEnum.name} {\n${values}\n}`;
  }

  generateInterface(message: ProtoMessage): string {
    if (message.fields.length === 0) {
      return `export interface ${message.name} {}`;
    }

    const fields = message.fields.map(field => {
      let type = field.type;
      if (field.repeated) {
        type = `${type}[]`;
      }
      
      const optional = field.optional ? '?' : '';
      return `  ${field.name}${optional}: ${type};`;
    }).join('\n');

    return `export interface ${message.name} {\n${fields}\n}`;
  }

  generateServiceInterface(service: ProtoService): string {
    const methods = service.methods.map(method => {
      return `  ${method.name}(request: ${method.request}): Promise<${method.response}>;`;
    }).join('\n');

    return `export interface ${service.name} {\n${methods}\n}`;
  }

  generateClientInterface(service: ProtoService): string {
    const methods = service.methods.map(method => {
      return `  ${method.name}(request: ${method.request}): Promise<${method.response}>;`;
    }).join('\n');

    return `export interface ${service.name}Client {\n${methods}\n}`;
  }
}

function readProtoFile(filePath: string): string {
  console.log(`正在读取 proto 文件：${filePath}`);
  
  try {
    const content = readFileSync(filePath, 'utf8');
    console.log('proto 文件读取成功');
    return content;
  } catch (error) {
    console.error('读取 proto 文件失败:', error);
    throw error;
  }
}

function generateTypeScriptDeclarations(protoContent: string): string {
  const parser = new ProtoParser(protoContent);
  const generator = new TypeScriptGenerator();

  const enums = parser.parseEnums();
  const messages = parser.parseMessages();
  const services = parser.parseServices();

  const enumDeclarations = enums.map(e => generator.generateEnum(e));
  const interfaceDeclarations = messages.map(m => generator.generateInterface(m));
  const serviceDeclarations = services.map(s => generator.generateServiceInterface(s));
  const clientDeclarations = services.map(s => generator.generateClientInterface(s));

  const header = `// 自动生成的类型声明文件
// 生成时间: ${new Date().toISOString()}
// 来源: schemas/scintirete.proto

`;

  return [
    header,
    '// ==================== 枚举类型 ====================',
    ...enumDeclarations,
    '',
    '// ==================== 消息类型 ====================',
    ...interfaceDeclarations,
    '',
    '// ==================== 服务接口 ====================',
    ...serviceDeclarations,
    '',
    '// ==================== 客户端接口 ====================',
    ...clientDeclarations
  ].join('\n\n');
}

function main() {
  const protoPath = resolve('schemas/scintirete.proto');
  const outputPath = 'types/scintirete.d.ts';

  try {
    console.log('开始生成 TypeScript 声明文件...');
    
    // 读取本地 proto 文件
    const protoContent = readProtoFile(protoPath);
    
    // 生成 TypeScript 声明
    const typeScriptDeclarations = generateTypeScriptDeclarations(protoContent);
    
    // 确保输出目录存在
    mkdirSync(dirname(outputPath), { recursive: true });
    
    // 写入文件
    writeFileSync(outputPath, typeScriptDeclarations, 'utf8');
    
    console.log(`✅ TypeScript 声明文件已生成: ${outputPath}`);
    console.log('生成完成！');
    
  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

// 执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 