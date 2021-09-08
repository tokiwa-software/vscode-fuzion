build-vsix:
	npm i
	npm run esbuild
	make -C fuzion-lsp-server classes
	./node_modules/.bin/vsce package