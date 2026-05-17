import { search } from "google-sr";

search({ query: "new latest pictures", safeMode: true }).then((results: any) => {
    console.log(results);
}).catch((e: any) => console.error(e));
