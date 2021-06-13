/* global diffUsingJS,difflib,diffview, getConfig,getPWAFiles */


const sw_path = "/zed/pwa/sw/background.sw.js";
const config_url = "/zed/pwa/files.json";

document.addEventListener('DOMContentLoaded', bootPage);


function bootPage() {
    getConfig().then(loadPage).
    catch (console.warn.bind(console));
}

function loadPage(config) {
    if (config && config.site.diff) {

        getPWAFiles().then(function(files) {

            const
            trimStart = config.site.diff.newBase.replace(/\/$/, '') + '/',
            trimFrom = trimStart.length,
            list = files.github.filter(function(f) {
                return f.startsWith(trimStart);
            }).map(function(f) {
                return f.substr(trimFrom);
            }),
            fileSelector = byId("selectFile"),
            firstFile = location.search ? location.search.substr(1) : config.site.diff.
            default;

            fileSelector.innerHTML = list.map(function(file) {
                const selected = (file === firstFile) ? ' selected' : '';
                return '<option' + selected + ' value="' + file + '">' + file + '</option>';
            }).join("\n");


            fileSelector.addEventListener("change", function() {
                showFile(config, fileSelector.value);
            });

            showFile(config, firstFile);
        });

    }



}

function showFile(config, file) {
    showFileDifference(
    config.site.diff.base,
    config.site.diff.newBase,
    config.site.diff.linkBase,
    config.site.diff.newLinkBase,
    file,
    0);
}


function loadURLS(url1, url2, link1, link2) {

    return new Promise(promised);

    function promised(resolve, reject) {


        fetch(url1)
            .then(toText)
            .then(toElement("baseText", link1))
            .then(function() {

            fetch(url2)
                .then(toText)
                .then(toElement("newText", link2))
                .then(function() {
                resolve();

            })

        })
    }


}

function showFileDifference(base, newBase, linkBase, newLinkBase, file, viewType) {
    const fixurl = function(base, file) {
        return 'https://' + (base.replace(/^https:\/\//, '') + '/' + file).replace(/\/\//g, '/');
    };
    const url1 = fixurl(base, file);
    const url2 = fixurl(newBase, file);

    const link1 = fixurl(linkBase, file);
    const link2 = fixurl(newLinkBase, file);

    loadURLS(url1, url2, link1, link2)

        .then(function(diffs) {

        diffUsingJS(viewType);

    });
}

function diffUsingJS(viewType) {
    "use strict";
    var byId = function(id) {
        return document.getElementById(id);
    },
    base = difflib.stringAsLines(byId("baseText").value),
        newtxt = difflib.stringAsLines(byId("newText").value),
        sm = new difflib.SequenceMatcher(base, newtxt),
        opcodes = sm.get_opcodes(),
        diffoutputdiv = byId("diffoutput"),
        contextSize = byId("contextSize").value;

    diffoutputdiv.innerHTML = "";
    contextSize = contextSize || null;

    diffoutputdiv.appendChild(diffview.buildView({
        baseTextLines: base,
        newTextLines: newtxt,
        opcodes: opcodes,
        baseTextName: "Base Text",
        newTextName: "New Text",
        contextSize: contextSize,
        viewType: viewType
    }));
}



function byId(id) {
    return document.getElementById(id);
}


function toElement(id, url) {
    return function(text) {
        byId(id).value = text;
        byId(id + "_caption").innerHTML = '<a href="' + url + '">' + url.split('://').pop() + '</a>';
        return Promise.resolve();

    };
}

function toText(response) {
    return response.text()
}

function downloadJSON(response) {
    return response.json();
}