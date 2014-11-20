.PHONY: test watch

test:
	./node_modules/.bin/mocha --reporter list --compilers litcoffee:coffee-script/register

watch:
	./node_modules/.bin/nodemon  ./node_modules/.bin/mocha --reporter list --compilers litcoffee:coffee-script/register --growl --bail --debug
