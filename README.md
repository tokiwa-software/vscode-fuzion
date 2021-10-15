# vscode-fuzion README

This is a Visual Studio Code extension to support development in the [Fuzion Programming Language](https://flang.dev).
![Fuzion logo](images/fuzion_logo_196.png)


To start using the extension, download, unzip and copy the vscode-fuzion-n.m.o folder into your <user home>/.vscode/extensions folder and restart VS Code.

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

## Develop
- Prerequisites: make, node, npm, javac
- git submodule update --init --recursive
- start debugging in vscode
- (optional) attach to java debugger at port 8000

## Build
- Prerequisites: make, node, npm, javac
- npm run vscode:package

## Build docker openvscode-server
- npm run vscode:package && docker build .
- run with something like this: docker run -it --init -p 3000:3000 -v "<path_to_source_code>/home/workspace:cached"
