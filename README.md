# ![fuzion_logo_25.png](images/fuzion_logo_25.png) Fuzion extension for Visual Studio Code

This is a Visual Studio Code extension to support development in the [Fuzion Programming Language](https://flang.dev).

## Install (Java 17 required)
- https://marketplace.visualstudio.com/items?itemName=tokiwa-software.fuzion-lang
- https://open-vsx.org/extension/tokiwa-software/fuzion-lang

## Develop
- Prerequisites: make, node, npm, javac
- git submodule update --init --recursive
- start debugging in vscode
- (optional) attach to java debugger at port 8000

## Build
- Prerequisites: make, node, npm, javac
- npm run vscode:package

## Features

- Syntax Highlighting for `.fz` files
- Language Server Client

### Syntax Highlighting
![Syntax Highlighting](images/syntax_highlighting.png)

### Definition
![Definition](images/lsp_definition.png)

### Completion
![Completion](images/lsp_completion.png)

### Hover
![Hover](images/lsp_hover.png)

### References
![References](images/lsp_references.png)

### Diagnostics
![Diagnostics](images/lsp_diagnostics.png)

### Renaming
![Renaming](images/lsp_rename.webp)

### Evaluation
![Evaluation](images/lsp_evaluate_file.webp)

### Syntax Tree
![Syntax Tree](images/lsp_show_syntax_tree.webp)

### Outline
![Outline](images/lsp_document_symbols.png)

### Signature Help
![Signature Help](images/lsp_signature_help.png)
