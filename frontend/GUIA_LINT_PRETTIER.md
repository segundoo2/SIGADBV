# Guia: ESLint e Prettier estritos em Frontend

Este guia descreve uma configuração moderna com ESLint flat config, TypeScript com verificacao de tipos, regras do framework e Prettier. Os exemplos usam pnpm, mas os conceitos tambem servem para npm ou yarn.

## 1. Instale as ferramentas

No workspace do frontend:

```bash
pnpm add -D eslint @eslint/js typescript-eslint prettier eslint-plugin-prettier eslint-config-prettier globals
```

Instale tambem os plugins do framework usado:

```bash
# Angular
pnpm add -D @angular-eslint/eslint-plugin @angular-eslint/eslint-plugin-template @angular-eslint/template-parser

# React
pnpm add -D eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y

# Vue
pnpm add -D eslint-plugin-vue vue-eslint-parser
```

Use somente os plugins do framework do projeto. Fixe as versoes no lockfile e prefira a major do ESLint adotada pelo restante do repositorio. Projetos que usam ESLint 9 devem manter uma configuracao flat `eslint.config.mjs`; nao misture com `.eslintrc` legado.

## 2. Configure o TypeScript

O lint tipado precisa encontrar os arquivos TS atraves dos `tsconfig`. Em Angular, inclua os fontes de aplicacao e os specs nos projetos apropriados, por exemplo `tsconfig.app.json` e `tsconfig.spec.json`. O `projectService` do typescript-eslint escolhe o projeto correspondente a cada arquivo.

O lint tipado e mais caro que o lint sintatico, mas encontra problemas que dependem dos tipos: Promises esquecidas, retornos inseguros, asserts desnecessarios e uso incorreto de APIs.

## 3. ESLint para Angular

Exemplo de `eslint.config.mjs` para ESLint 9, Angular standalone, Vitest e Prettier:

```js
// @ts-check
import eslint from '@eslint/js';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'src/index.html',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.ts'],
    plugins: {
      '@angular-eslint': angular,
      '@angular-eslint/template': angularTemplate,
    },
    processor: angularTemplate.processors['extract-inline-html'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Perfil tipado semelhante ao usado no backend.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      // Convenções Angular.
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/no-output-native': 'error',
      '@angular-eslint/no-output-on-prefix': 'error',
      '@angular-eslint/prefer-inject': 'error',
      '@angular-eslint/prefer-standalone': 'error',
    },
  },
  {
    ...tseslint.configs.disableTypeChecked,
    files: ['**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
      parserOptions: {
        project: false,
        projectService: false,
      },
    },
    plugins: {
      '@angular-eslint/template': angularTemplate,
    },
    rules: {
      // O Prettier formata templates pelo script format/format:check.
      'prettier/prettier': 'off',
      ...tseslint.configs.disableTypeChecked.rules,
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/valid-aria': 'error',
    },
  },
  {
    // Assertions de spies Vitest referenciam metodos sem invoca-los.
    // Mantenha esta excecao restrita a specs; producao continua tipada.
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
```

Aplique as regras Angular recomendadas do plugin e ajuste o bloco de templates conforme as APIs disponiveis na versao instalada. O parser de templates e diferente do parser TypeScript; regras que exigem type information devem ser desativadas para HTML.

## 4. Prettier

Mantenha um unico arquivo de opcoes, por exemplo `.prettierrc`:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

`eslint-plugin-prettier/recommended` transforma diferencas de Prettier em erros do ESLint para TypeScript. Use Prettier diretamente para HTML, CSS, JSON e demais arquivos; isso tambem evita divergencias entre o parser de templates do Angular e o parser do Prettier.

## 5. Scripts do package.json

Adicione comandos separados para verificar, corrigir e formatar:

```json
{
  "scripts": {
    "lint": "eslint \"src/**/*.{ts,html}\"",
    "lint:fix": "eslint \"src/**/*.{ts,html}\" --fix",
    "format": "prettier --write \"src/**/*.{ts,html,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,css}\""
  }
}
```

Execute antes de enviar alteracoes:

```bash
pnpm format:check
pnpm lint
pnpm test
pnpm build
```

`lint:fix` e `format` alteram arquivos. Revise o diff depois de executa-los; correcao automatica nao substitui revisao de comportamento.

## 6. React e Vue

Mantenha a base TypeScript/Prettier e adicione configuracoes somente para as extensoes do framework.

### React

Registre `eslint-plugin-react`, `eslint-plugin-react-hooks` e `eslint-plugin-jsx-a11y` em um bloco para `**/*.{jsx,tsx}`. Use as configuracoes flat recomendadas exportadas pelas versoes instaladas, configure `settings.react.version: 'detect'` e mantenha regras de hooks e acessibilidade como erros. Garanta que o parser TypeScript inclua arquivos `.tsx` no projeto tipado.

Exemplo de bloco a integrar ao flat config:

```js
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

{
  files: ['**/*.{jsx,tsx}'],
  plugins: {
    react,
    'react-hooks': reactHooks,
    'jsx-a11y': jsxA11y,
  },
  settings: { react: { version: 'detect' } },
  rules: {
    ...react.configs.flat.recommended.rules,
    ...react.configs.flat['jsx-runtime'].rules,
    ...reactHooks.configs.flat.recommended.rules,
    ...jsxA11y.configs.recommended.rules,
  },
}
```

### Vue

Use `eslint-plugin-vue` com `vue-eslint-parser`, aplicando a configuracao flat recomendada a `**/*.vue`. Para `<script lang="ts">`, configure o parser TypeScript como parser interno do parser Vue e inclua `.vue` em `extraFileExtensions` do projeto tipado.

```js
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

// Adicione ao array de configuracao:
...vue.configs['flat/recommended'],
{
  files: ['**/*.vue'],
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      parser: tseslint.parser,
      projectService: true,
      extraFileExtensions: ['.vue'],
    },
  },
},
```

Confirme os nomes dos presets na versao do plugin instalada; os exports flat evoluem entre majors.

## 7. Fronteiras da arquitetura

ESLint verifica sintaxe, tipos e convencoes, mas nao garante sozinho a Clean Architecture. Mantenha entidades e regras de negocio independentes do framework; coloque casos de uso e portas de aplicacao na camada interna; deixe `HttpClient`, DTOs REST e adapters na infraestrutura. Se quiser impor a direcao dos imports automaticamente, adicione uma regra de boundaries ou uma ferramenta de analise de dependencias e teste que `domain` nao importe `application`, Angular ou `infra`.
