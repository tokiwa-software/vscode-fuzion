build-vsix:
	npm run vscode:package

build-docker: build-vsix
	docker build -t 'vscode-fuzion' .
