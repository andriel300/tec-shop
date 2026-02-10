import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { NotificationType } from '@tec-shop/dto';

interface TemplateDefinition {
  title: string;
  message: string;
  type: NotificationType;
}

interface RenderedTemplate {
  title: string;
  message: string;
  type: NotificationType;
}

export class TemplateEngine {
  private templates = new Map<string, TemplateDefinition>();

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    const templatesDir = join(__dirname, 'templates');

    try {
      const files = readdirSync(templatesDir).filter((f) =>
        f.endsWith('.json')
      );

      for (const file of files) {
        const filePath = join(templatesDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content) as Record<string, TemplateDefinition>;

        for (const [key, template] of Object.entries(parsed)) {
          this.templates.set(key, template);
        }
      }
    } catch (_error) {
      // Templates directory may not exist in all environments
      // Templates can be registered manually via registerTemplate
    }
  }

  registerTemplate(id: string, template: TemplateDefinition): void {
    this.templates.set(id, template);
  }

  render(
    templateId: string,
    variables: Record<string, string>
  ): RenderedTemplate {
    const template = this.templates.get(templateId);

    if (!template) {
      return {
        title: templateId,
        message: `Notification: ${templateId}`,
        type: 'INFO' as NotificationType,
      };
    }

    return {
      title: this.interpolate(template.title, variables),
      message: this.interpolate(template.message, variables),
      type: template.type,
    };
  }

  private interpolate(
    text: string,
    variables: Record<string, string>
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      return variables[key] ?? match;
    });
  }

  getTemplateIds(): string[] {
    return Array.from(this.templates.keys());
  }

  hasTemplate(templateId: string): boolean {
    return this.templates.has(templateId);
  }
}
