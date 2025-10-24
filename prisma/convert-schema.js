#!/usr/bin/env node

/**
 * Prisma Schema 字段名转换工具 (完美版)
 * 完美处理字段名转换和所有索引引用更新
 */

const fs = require('fs');
const path = require('path');

class PerfectFieldConverter {
  constructor(schemaPath) {
    this.schemaPath = schemaPath;
    this.originalContent = fs.readFileSync(schemaPath, 'utf8');
  }

  toCamelCase(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  toPascalCase(str) {
    return this.toCamelCase(str).replace(/^[a-z]/, letter => letter.toUpperCase());
  }

  backup() {
    const backupPath = this.schemaPath.replace('.prisma', '.backup.prisma');
    fs.writeFileSync(backupPath, this.originalContent);
    console.log(`✅ 备份到: ${backupPath}`);
  }

  convert() {
    console.log('🚀 开始转换字段名...');
    this.backup();

    const lines = this.originalContent.split('\n');
    const result = [];
    let inModel = false;
    let modelName = '';
    const fieldMappings = new Map(); // 存储所有字段映射

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();

      // 处理 model 定义
      if (trimmed.startsWith('model ') && trimmed.includes('{')) {
        const match = trimmed.match(/^model\s+([a-z_][a-z0-9_]*)/);
        if (match) {
          modelName = match[1];
          const newModelName = this.toPascalCase(modelName);
          line = line.replace(modelName, newModelName);
          inModel = true;
        }
      }

      // 处理模型结束
      if (inModel && trimmed === '}' && !line.includes('//')) {
        result.push(`  @@map("${modelName}")`);
        result.push(line);
        inModel = false;
        modelName = '';
        continue;
      }

      // 处理字段定义
      if (inModel && !trimmed.startsWith('//') && !trimmed.startsWith('@@') && trimmed && !trimmed.startsWith('}')) {
        // 使用更精确的字段匹配
        const fieldMatch = line.match(/^(\s*)([a-z_][a-z0-9_]*)\s+([a-zA-Z\[\]?]+)(.*)$/);

        if (fieldMatch) {
          const [, indent, fieldName, fieldType, rest] = fieldMatch;

          // 检查是否需要转换字段名
          if (fieldName.includes('_') && !line.includes('@map(')) {
            const camelCaseField = this.toCamelCase(fieldName);

            // 存储字段映射关系
            fieldMappings.set(`${modelName}.${fieldName}`, camelCaseField);

            // 替换字段名并添加 @map
            line = `${indent}${camelCaseField} ${fieldType}${rest} @map("${fieldName}")`;
          }
        }
      }

      result.push(line);
    }

    // 第二遍：更新所有索引引用
    console.log('🔄 更新索引引用...');
    const finalResult = [];
    inModel = false;
    modelName = '';

    for (const line of result) {
      const trimmed = line.trim();

      // 处理 model 定义
      if (trimmed.startsWith('model ') && trimmed.includes('{')) {
        const match = trimmed.match(/^model\s+([a-zA-Z][a-zA-Z0-9_]*)/);
        if (match) {
          // 找到原始模型名（从帕斯卡命名反向查找）
          for (const [modelField] of fieldMappings) {
            const [model] = modelField.split('.');
            const pascalModel = this.toPascalCase(model);
            if (pascalModel === match[1]) {
              modelName = model;
              break;
            }
          }
          inModel = true;
        }
      }

      // 处理模型结束
      if (inModel && trimmed === '}' && !line.includes('//')) {
        inModel = false;
        modelName = '';
      }

      // 处理索引引用
      if (trimmed.startsWith('@@') && (trimmed.includes('index(') || trimmed.includes('unique('))) {
        let newLine = line;

        // 替换当前模型的所有字段引用
        for (const [modelField, camelField] of fieldMappings) {
          const [model, field] = modelField.split('.');
          if (model === modelName) {
            // 替换索引中的字段名，支持多种格式
            newLine = newLine
              .replace(new RegExp(`\\[${field}\\]`, 'g'), `[${camelField}]`)
              .replace(new RegExp(`\\b${field}\\b(?!\\s*\\()`, 'g'), camelField);
          }
        }

        finalResult.push(newLine);
      } else {
        finalResult.push(line);
      }
    }

    // 写入结果
    fs.writeFileSync(this.schemaPath, finalResult.join('\n'));
    console.log('✅ 转换完成！');
    console.log(`📊 转换了 ${fieldMappings.size} 个字段`);
    console.log('💡 枚举类型保持不变，所有索引引用已更新');
  }

  restore() {
    const backupPath = this.schemaPath.replace('.prisma', '.backup.prisma');

    if (!fs.existsSync(backupPath)) {
      console.log('❌ 未找到备份文件');
      return;
    }

    fs.copyFileSync(backupPath, this.schemaPath);
    console.log('✅ 已恢复备份');
  }
}

function main() {
  const args = process.argv.slice(2);
  const schemaPath = path.join(__dirname, 'schema.prisma');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ 未找到 schema.prisma');
    process.exit(1);
  }

  const converter = new PerfectFieldConverter(schemaPath);

  if (args.includes('--restore')) {
    converter.restore();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Prisma Schema 字段名转换工具 (完美版)

用法:
  node convert-schema.js [选项]

选项:
  --restore   恢复备份
  --help, -h  帮助信息

功能:
  - 模型名: user_addresses → UserAddresses
  - 字段名: user_id → userId
  - 添加 @map() 和 @@map() 注解
  - 完美更新所有索引字段引用
  - 枚举类型保持不变
  - 支持复杂索引格式

转换示例:
  原始: @@index([user_id, created_at], map: "idx_user_period")
  转换: @@index([userId, createdAt], map: "idx_user_period")
`);
  } else {
    converter.convert();
  }
}

if (require.main === module) {
  main();
}