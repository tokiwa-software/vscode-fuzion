clean:
	make -C fuzion clean
	rm -f *.vsix
	rm -f *.js
	rm -f *.js.map

build-vsix: clean
	npm i
	npm run vscode:package

publish_marketplace_visualstudio:
	npx vsce publish

publish_open_vsx:
	npm run ovsx-publish
