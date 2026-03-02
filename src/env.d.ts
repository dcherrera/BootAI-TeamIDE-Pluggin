declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface TeamIDEApi {
  registerModule(definition: any): void;
  getSettings(moduleId: string): Record<string, any> | null;
  saveSettings(moduleId: string, settings: Record<string, any>): void;
}

interface Window {
  __teamide?: TeamIDEApi;
}
