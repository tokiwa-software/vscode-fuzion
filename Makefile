build-vsix:
	npm run vscode:package

build-docker: build-vsix
	docker rmi --force vscode-fuzion:latest
	docker build -t 'vscode-fuzion' .
