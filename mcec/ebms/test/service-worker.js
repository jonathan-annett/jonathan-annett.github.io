self.addEventListener('fetch', function (event) {
    event.respondWith(
        (async function () {
            const url = new URL(event.request.url);
            if (url.pathname.startsWith("/odata/")) {
                const entitySet = url.pathname.split('/').pop();
                const db = new Dexie("MyDatabase");
                db.version(1).stores({
                    products: "++id,name,price"
                });

                if (entitySet === "Products") {
                    const products = await db.products.toArray();
                    return new Response(JSON.stringify({ value: products }), {
                        headers: { "Content-Type": "application/json" }
                    });
                }
            }

            return fetch(event.request);
        })()
    );
});
