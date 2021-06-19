/*global self */
/*global self,localforage*/

const multiLoad= function (B, O0, T) {
    let boot = function(d) {
        d = d.filter(function(x) {
            return !B[x];
        });
        if (d.length) {
            return setTimeout(boot, 10, d);
        }
        T();
    };
    boot(O0);
},__ml2=function (L, o, a, d) {
    let u, n = a[L] && a[L].name, x = n && o[n] === u ? Object.defineProperty(o, n, {
        value: a[L].apply(this, d[L].map(function(f) {
            return f();
        })),
        enumerable: !0,
        configurable: !0
    }) : u;
},__ml3=function  () {
   return typeof self === "object" && self.constructor.name || "x";
},__ml1=function  () {
   return typeof self === "object" && self||{};
},__ml4=function  () {
   return typeof self === "object" && self;
};


multiLoad(__ml1(),['wToolsLib'],function(){__ml2(__ml3(),__ml4(),

    {

        Window: function wTools(setKey_, getKey, wToolsLib) {


        },

        ServiceWorkerGlobalScope: function wTools(setKey_, getKey) {
            const lib = {}



            return lib;
        },

    }, {
        Window: [

        function() {
            return 0;
        },

        function() {
            return 0;
        },

        function() {
            return self.wToolsLib;
        },

        function() {
            return 0;
        }

        ],
        ServiceWorkerGlobalScope: [

        function() {
            return 0;
        },

        function() {
            return 0;
        },

        function() {
            return 0;
        }

        ],
    }

    );


    /*

local imports - these functions are available to the other modules declared in this file

*/


});