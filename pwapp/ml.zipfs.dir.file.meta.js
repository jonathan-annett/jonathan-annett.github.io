/* global ml,ace */

ml(`

  aceModeList@Window    | ${ml.c.app_root}ace/ext-modelist.js
  pwaWindow@Window      | ${ml.c.app_root}ml.pwa-win.js
    
`,function(){ml(2,

    {
        Window: function htmlFileMetaLib( lib ) {
            return lib;
        },

        ServiceWorkerGlobalScope: function htmlFileMetaLib( lib ) {
             return lib;
        } 
    }, {
        Window: [
            ()=> htmlFileMetaLib()
        ],
        ServiceWorkerGlobalScope: [
            ()=> htmlFileMetaLib()
        ]
    }

    );


    function htmlFileMetaLib (options) {
        
         return {
            fileIsEditable,
            fileIsImage,
            aceModeForFile,
            aceThemeForFile,
            aceModeHasWorker
        };

        function fileIsEditable (filename) {
             const p = filename.lastIndexOf('.');
             return p < 1 ? false:[
                                      "ada",
                                      "adb",
                                      "ads",
                                      "applescript",
                                      "as",
                                      "asc",
                                      "ascii",
                                      "ascx",
                                      "asm",
                                      "asmx",
                                      "asp",
                                      "aspx",
                                      "atom",
                                      "au3",
                                      "awk",
                                      "bas",
                                      "bash",
                                      "bashrc",
                                      "bat",
                                      "bbcolors",
                                      "bcp",
                                      "bdsgroup",
                                      "bdsproj",
                                      "bib",
                                      "bowerrc",
                                      "c",
                                      "cbl",
                                      "cc",
                                      "cfc",
                                      "cfg",
                                      "cfm",
                                      "cfml",
                                      "cgi",
                                      "cjs",
                                      "clj",
                                      "cljs",
                                      "cls",
                                      "cmake",
                                      "cmd",
                                      "cnf",
                                      "cob",
                                      "code-snippets",
                                      "coffee",
                                      "coffeekup",
                                      "conf",
                                      "cp",
                                      "cpp",
                                      "cpt",
                                      "cpy",
                                      "crt",
                                      "cs",
                                      "csh",
                                      "cson",
                                      "csproj",
                                      "csr",
                                      "css",
                                      "csslintrc",
                                      "csv",
                                      "ctl",
                                      "curlrc",
                                      "cxx",
                                      "d",
                                      "dart",
                                      "dfm",
                                      "diff",
                                      "dof",
                                      "dpk",
                                      "dpr",
                                      "dproj",
                                      "dtd",
                                      "eco",
                                      "editorconfig",
                                      "ejs",
                                      "el",
                                      "elm",
                                      "emacs",
                                      "eml",
                                      "ent",
                                      "erb",
                                      "erl",
                                      "eslintignore",
                                      "eslintrc",
                                      "ex",
                                      "exs",
                                      "f",
                                      "f03",
                                      "f77",
                                      "f90",
                                      "f95",
                                      "fish",
                                      "for",
                                      "fpp",
                                      "frm",
                                      "fs",
                                      "fsproj",
                                      "fsx",
                                      "ftn",
                                      "gemrc",
                                      "gemspec",
                                      "gitattributes",
                                      "gitconfig",
                                      "gitignore",
                                      "gitkeep",
                                      "gitmodules",
                                      "go",
                                      "gpp",
                                      "gradle",
                                      "graphql",
                                      "groovy",
                                      "groupproj",
                                      "grunit",
                                      "gtmpl",
                                      "gvimrc",
                                      "h",
                                      "haml",
                                      "hbs",
                                      "hgignore",
                                      "hh",
                                      "hpp",
                                      "hrl",
                                      "hs",
                                      "hta",
                                      "htaccess",
                                      "htc",
                                      "htm",
                                      "html",
                                      "htpasswd",
                                      "hxx",
                                      "iced",
                                      "iml",
                                      "inc",
                                      "inf",
                                      "info",
                                      "ini",
                                      "ino",
                                      "int",
                                      "irbrc",
                                      "itcl",
                                      "itermcolors",
                                      "itk",
                                      "jade",
                                      "java",
                                      "jhtm",
                                      "jhtml",
                                      "js",
                                      "jscsrc",
                                      "jshintignore",
                                      "jshintrc",
                                      "json",
                                      "json5",
                                      "jsonld",
                                      "jsp",
                                      "jspx",
                                      "jsx",
                                      "ksh",
                                      "less",
                                      "lhs",
                                      "lisp",
                                      "log",
                                      "ls",
                                      "lsp",
                                      "lua",
                                      "m",
                                      "m4",
                                      "mak",
                                      "map",
                                      "markdown",
                                      "master",
                                      "md",
                                      "mdown",
                                      "mdwn",
                                      "mdx",
                                      "metadata",
                                      "mht",
                                      "mhtml",
                                      "mjs",
                                      "mk",
                                      "mkd",
                                      "mkdn",
                                      "mkdown",
                                      "ml",
                                      "mli",
                                      "mm",
                                      "mxml",
                                      "nfm",
                                      "nfo",
                                      "noon",
                                      "npmignore",
                                      "npmrc",
                                      "nuspec",
                                      "nvmrc",
                                      "ops",
                                      "pas",
                                      "pasm",
                                      "patch",
                                      "pbxproj",
                                      "pch",
                                      "pem",
                                      "pg",
                                      "php",
                                      "php3",
                                      "php4",
                                      "php5",
                                      "phpt",
                                      "phtml",
                                      "pir",
                                      "pl",
                                      "pm",
                                      "pmc",
                                      "pod",
                                      "pot",
                                      "prettierrc",
                                      "properties",
                                      "props",
                                      "pt",
                                      "pug",
                                      "purs",
                                      "py",
                                      "pyx",
                                      "r",
                                      "rake",
                                      "rb",
                                      "rbw",
                                      "rc",
                                      "rdoc",
                                      "rdoc_options",
                                      "resx",
                                      "rexx",
                                      "rhtml",
                                      "rjs",
                                      "rlib",
                                      "ron",
                                      "rs",
                                      "rss",
                                      "rst",
                                      "rtf",
                                      "rvmrc",
                                      "rxml",
                                      "s",
                                      "sass",
                                      "scala",
                                      "scm",
                                      "scss",
                                      "seestyle",
                                      "sh",
                                      "shtml",
                                      "sln",
                                      "sls",
                                      "spec",
                                      "sql",
                                      "sqlite",
                                      "sqlproj",
                                      "srt",
                                      "ss",
                                      "sss",
                                      "st",
                                      "strings",
                                      "sty",
                                      "styl",
                                      "stylus",
                                      "sub",
                                      "sublime-build",
                                      "sublime-commands",
                                      "sublime-completions",
                                      "sublime-keymap",
                                      "sublime-macro",
                                      "sublime-menu",
                                      "sublime-project",
                                      "sublime-settings",
                                      "sublime-workspace",
                                      "sv",
                                      "svc",
                                      "svg",
                                      "swift",
                                      "t",
                                      "tcl",
                                      "tcsh",
                                      "terminal",
                                      "tex",
                                      "text",
                                      "textile",
                                      "tg",
                                      "tk",
                                      "tmLanguage",
                                      "tmpl",
                                      "tmTheme",
                                      "tpl",
                                      "ts",
                                      "tsv",
                                      "tsx",
                                      "tt",
                                      "tt2",
                                      "ttml",
                                      "twig",
                                      "txt",
                                      "v",
                                      "vb",
                                      "vbproj",
                                      "vbs",
                                      "vcproj",
                                      "vcxproj",
                                      "vh",
                                      "vhd",
                                      "vhdl",
                                      "vim",
                                      "viminfo",
                                      "vimrc",
                                      "vm",
                                      "vue",
                                      "webapp",
                                      "webmanifest",
                                      "wsc",
                                      "x-php",
                                      "xaml",
                                      "xht",
                                      "xhtml",
                                      "xml",
                                      "xs",
                                      "xsd",
                                      "xsl",
                                      "xslt",
                                      "y",
                                      "yaml",
                                      "yml",
                                      "zsh",
                                      "zshrc"
                                  ].indexOf(filename.substr(p+1))>=0;
         }
         
        function fileIsImage (filename) {
            const p = filename.lastIndexOf('.');
            return p < 1 ? false:[
                                     "ase",
                                     "art",
                                     "bmp",
                                     "blp",
                                     "cd5",
                                     "cit",
                                     "cpt",
                                     "cr2",
                                     "cut",
                                     "dds",
                                     "dib",
                                     "djvu",
                                     "egt",
                                     "exif",
                                     "gif",
                                     "gpl",
                                     "grf",
                                     "icns",
                                     "ico",
                                     "iff",
                                     "jng",
                                     "jpeg",
                                     "jpg",
                                     "jfif",
                                     "jp2",
                                     "jps",
                                     "lbm",
                                     "max",
                                     "miff",
                                     "mng",
                                     "msp",
                                     "nitf",
                                     "ota",
                                     "pbm",
                                     "pc1",
                                     "pc2",
                                     "pc3",
                                     "pcf",
                                     "pcx",
                                     "pdn",
                                     "pgm",
                                     "PI1",
                                     "PI2",
                                     "PI3",
                                     "pict",
                                     "pct",
                                     "pnm",
                                     "pns",
                                     "ppm",
                                     "psb",
                                     "psd",
                                     "pdd",
                                     "psp",
                                     "px",
                                     "pxm",
                                     "pxr",
                                     "qfx",
                                     "raw",
                                     "rle",
                                     "sct",
                                     "sgi",
                                     "rgb",
                                     "int",
                                     "bw",
                                     "tga",
                                     "tiff",
                                     "tif",
                                     "vtf",
                                     "xbm",
                                     "xcf",
                                     "xpm",
                                     "3dv",
                                     "amf",
                                     "ai",
                                     "awg",
                                     "cgm",
                                     "cdr",
                                     "cmx",
                                     "dxf",
                                     "e2d",
                                     "egt",
                                     "eps",
                                     "fs",
                                     "gbr",
                                     "odg",
                                     "svg",
                                     "stl",
                                     "vrml",
                                     "x3d",
                                     "sxd",
                                     "v2d",
                                     "vnd",
                                     "wmf",
                                     "emf",
                                     "art",
                                     "xar",
                                     "png",
                                     "webp",
                                     "jxr",
                                     "hdp",
                                     "wdp",
                                     "cur",
                                     "ecw",
                                     "iff",
                                     "lbm",
                                     "liff",
                                     "nrrd",
                                     "pam",
                                     "pcx",
                                     "pgf",
                                     "sgi",
                                     "rgb",
                                     "rgba",
                                     "bw",
                                     "int",
                                     "inta",
                                     "sid",
                                     "ras",
                                     "sun",
                                     "tga"
                                 ].indexOf(filename.substr(p+1))>=0;
        }
        
        function aceModeForFile(fn ) {
            if (!aceModeForFile.cache) {
                aceModeForFile.cache = {
                    html : "ace/mode/html",
                    js   : "ace/mode/javascript",
                    json : "ace/mode/json",
                    md   : "ace/mode/markdown",
                    css  : "ace/mode/css"
                    
                }
            }
            const base  = fn.split('/').pop();
            const ix    = base.lastIndexOf(".");
            const ext   = ix < 0 ? false : base.substr(ix+1);
            return ext ? aceModeForFile.cache[ext]||(function(){
                aceModeForFile.modelist = ml.i.aceModeList;
                const mode = aceModeForFile.modelist ? aceModeForFile.modelist.getModeForPath(fn).mode : false;
                if (mode) {
                    aceModeForFile.cache[ext] = mode;
                }
                return mode;
            })() : "ace/mode/text";
        }
        
        function aceModeHasWorker(mode,cb) {
            if (aceModeHasWorker.cache && typeof aceModeHasWorker.cache[mode]==='boolean') {
                cb( aceModeHasWorker.cache[mode])
            } else {
                aceModeHasWorker.cache = aceModeHasWorker.cache||{}
                const url = location.origin+ml.c.app_root+'ace/worker-'+mode.replace(/^ace\/mode\//,'')+'.js';
                ml.i.pwaWindow.virtualDirQuery(url,function(err,event){
                    aceModeHasWorker.cache[mode] = !err&&event&&!!event.buffer;
                    return cb (aceModeHasWorker.cache[mode]);                
                });
            }
        }
        
        function aceThemeForFile(fn ) {
            if (!aceThemeForFile.defs) {
                aceThemeForFile.defs = {
                    html : "ace/theme/cobalt",
                    js   : "ace/theme/chaos",
                    json : "ace/theme/monokai",
                    md   : "ace/theme/dawn",
                    css  : "ace/theme/pastel_on_dark",
                };
                
            }
            if (!aceThemeForFile.cache) {
                aceThemeForFile.cache = {};
            }
            const base  = fn.split('/').pop();
            const ix    = base.lastIndexOf(".");
            const ext   = ix < 0 ? false : base.substr(ix+1);
            const theme = aceThemeForFile.cache[fn] || (aceThemeForFile.cache[fn]=((ext && aceThemeForFile.defs[ext]) ||"ace/theme/chrome"));
            return theme;
        }
        
    

    }
    
    

});
