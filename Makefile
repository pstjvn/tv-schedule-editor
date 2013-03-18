#This makefile assumes you have your tools in a parent directory as follow
# __someparentfoler__
# 	compiler/
# 		compiler.jar
# 	library/
# 		svn checkout of the latest closure library
# 	stylesheets/
# 		cs.jar
# 	templates/
# 		SoyToJsCompiler.jar
# 		soyutils.js
# 		soyutils_usegoog.js
# 	apps/
# 		@yourproject
# 	jsdoc/
# 		plugins/removegoog.js
#
#
# 	Project structure:
# 	/ - list of html files to load. $(NS).html format is preferred.
# 	assets/ - all images and static assets (fonts etc).
# 	build/ - the build files will be put in there.
# 	gss/ - gss source files in this directory will be always included.
# 		common/ - gss source files in this directory will also be always included, but are considered imported from elsewhere (i.e. not project specific)
# 		$(NS)/ - gss sources that are specific to the name space that is being build.
# 	js/ - tree of JavaScript files that will be available to the project (project specific). Could include a sub-module with another project if needed.
# 		templates/ - flat list of soy files to compile.
# 	tpl/ - list of locales that have been built
# 		$(LOCALE)/ - locale specific build of the templates.

# This should match most projects.
APPDIR=$(shell basename `pwd`)

# The default name space to build. Could be modified on the command line.
NS=app

# The directory name to use as a build target directory. All compiled
# JavaScript, CSS and dependency files will be stored there. The directory is
# considered dirty and is ignored by Git.
BUILDDIR=build

# The directory to put translation files in.
I18NDIR=i18n

# Option to localize / internationalize the project. Set to desired locale when
# compiling. The locale is propagated to the closure compiler.
LOCALE=en

# Where the compiled templates should be kept
# Basically we want them out of the build dir as they are not a build result of its own
TEMPLATE_TMP_DIR=tpl/

# The sources of the templates.
TEMPLATES_SOURCE_DIR=templates/

########################################
# Service variables. Please change those only if you know what you are doing!!!
#######################################
LIBRARY_PATH=../../library/
DEPSWRITER_BIN=$(LIBRARY_PATH)closure/bin/build/depswriter.py
TEMPLATES_PATH=../../templates/
APPS_PATH=apps/
COMPILER_JAR=../../compiler/compiler.jar
EXTERNS_PATH=../../externs/
STYLES_COMPILER_JAR=../../stylesheets/cs.jar
SOY_COMPILER_JAR=../../templates/SoyToJsSrcCompiler.jar
MESSAGE_EXTRACTOR_JAR=../../templates/SoyMsgExtractor.jar

# Default build to execute on 'make', update the CSS, templates and dependencies.
all: css tpl deps

# write dep file in js/build/
# This should happen AFTER building the templates as to assure the templates
# have all the provides needed for the dependencies.
deps:
	python ../../library/closure/bin/build/depswriter.py \
	--root_with_prefix="../../templates/ ../../../templates" \
	--root_with_prefix="js ../../../apps/$(APPDIR)/js" \
	--root_with_prefix="tpl/$(LOCALE) ../../../apps/$(APPDIR)/tpl/$(LOCALE)/" \
	--output_file="$(BUILDDIR)/deps.js"

# Compile template soy files from js/templates/ and put them in tpl/$(LOCALE)/
tpl:
	java -jar ../../templates/SoyToJsSrcCompiler.jar \
	--locales $(LOCALE) \
	--messageFilePathFormat "$(I18NDIR)/translations_$(LOCALE).xlf" \
	--shouldProvideRequireSoyNamespaces \
	--shouldGenerateJsdoc \
	--codeStyle concat \
	--cssHandlingScheme GOOG \
	--outputPathFormat 'tpl/$(LOCALE)/{INPUT_FILE_NAME_NO_EXT}.soy.js' \
	$(TEMPLATES_SOURCE_DIR)*.soy

# Extracts the translation messages from the templates in a file
# Translated file should be used to compile to a different locale.
extractmsgs:
	java -jar ../../templates/SoyMsgExtractor.jar \
	--outputFile "$(I18NDIR)/translations_$(LOCALE).xlf" \
	--targetLocaleString $(LOCALE) \
	$(TEMPLATES_SOURCE_DIR)*.soy


#create CSS file for name space and put name mapping in js/build/
css:
	java -jar ../../stylesheets/cs.jar \
	`cat options/css.ini | tr '\n' ' '` \
	--output-file $(BUILDDIR)/$(NS).css \
	--output-renaming-map $(BUILDDIR)/cssmap.js \
	gss/common/*.gss \
	gss/$(NS)/*.gss \
	gss/*.gss

# Used internally by the compile step. Builds minified css files with renamed
# class names.
cssbuild:
	java -jar ../../stylesheets/cs.jar \
	`cat options/cssbuild.ini | tr '\n' ' '` \
	--output-file $(BUILDDIR)/$(NS).css \
	--output-renaming-map $(BUILDDIR)/cssmap.js \
	gss/common/*.gss \
	gss/$(NS)/*.gss \
	gss/*.gss

# Performs advanced compilation on the target.
compile: tpl cssbuild
	python ../../library/closure/bin/build/closurebuilder.py \
	-n $(NS) \
	-f --flagfile=options/compile.ini \
	--root=js/ \
	--root=tpl/$(LOCALE)/ \
	--root=../pstj/ \
	--root=../../templates/ \
	--root=../../library/ \
	-f --js=build/cssmap.js \
	-f --define='goog.LOCALE="$(LOCALE)"' \
	-o compiled \
	-c ../../compiler/compiler.jar \
	--output_file=$(BUILDDIR)/$(NS).build.js
	rm $(BUILDDIR)/cssmap.js

# Used to perform debug compilation on the target.
debug: cssdebug
	python ../../library/closure/bin/build/closurebuilder.py \
	-n $(NS) \
	--root=js/ \
	--root=../../templates/ \
	--root=../../library/ \
	-o compiled \
	-c ../../compiler/compiler.jar \
	-f --debug \
	-f --flagfile=js/build-options.ini \
	--output_file=$(BUILDDIR)/$(NS).build.js
	rm $(BUILDDIR)/cssmap.js

# Create a structure for a new closure project.
# FIXME: This one is deprecated, use the pstj repo one!
initproject:
	mkdir -p gss/$(NS) gss/common js/templates $(I18NDIR) $(BUILDDIR) assets tpl
	touch index.html
	touch js/$(NS).js
	touch js/templates/$(NS).soy
	touch gss/$(NS)/$(NS).gss
	touch gss/base.gss
	touch js/build-options.ini
	echo "goog.provide('$(NS)');
$(NS) = function() {};" >> js/$(NS).js
	echo "--compilation_level=ADVANCED_OPTIMIZATIONS\n\
		--warning_level=VERBOSE\n\
		--use_types_for_optimization\n\
		--js=build/cssmap.js\n\
		--externs=../../externs/webkit_console.js" > js/build-options.ini

# Run the compiler against a specific name space only for the checks.
# This includes the templates (so it is compatible with applications and the
# library as well).
#
# To use it with application code replace the first root include to js/
check:
	python ../../library/closure/bin/build/closurebuilder.py \
	-n $(NS) \
	-f --flagfile=options/compile.ini \
	--root=js/ \
	--root=tpl/$(LOCALE)/ \
	--root=../pstj/ \
	--root=$(TEMPLATES_PATH) \
	--root=$(LIBRARY_PATH) \
	-o compiled \
	-c $(COMPILER_JAR) \
	--output_file=/dev/null

.PHONY: tpl css cssbuild deps all compile check

