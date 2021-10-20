# Fuzion extension for Visual Studio Code

This is a Visual Studio Code extension to support development in the [Fuzion Programming Language](https://flang.dev).
![Fuzion logo](images/fuzion_logo_196.png)

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
![Preview](images/vscode.png)

### Definition
![](images/lsp_definition.png)

### Completion
![](images/lsp_completion.png)

### Hover
![](images/lsp_hover.png)

### References
![](images/lsp_references.png)

### Diagnostics
![](images/lsp_diagnostics.png)

### Renaming
![](images/lsp_rename.webp)

### Evaluation
![](images/lsp_evaluate_file.png)

### Syntax Tree
![](images/lsp_show_syntax_tree.png)

### Outline
![](images/lsp_document_symbols.png)

