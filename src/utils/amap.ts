import "@amap/amap-jsapi-types";
import AMapLoader from "@amap/amap-jsapi-loader";

async function loadAMap() {
    return await AMapLoader.load({
        key: "c3255efdd2f295fa7d6d63ca3ba5ca60",
        version: "2.0",
        plugins: ['']
    });
}

function convertGPS(gps: [number, number]) {
    return new Promise<AMap.LngLat>((resolve, reject) => {
        AMap.convertFrom(gps, 'gps', (status: string, result: any) => {
            if (result.info === "ok") {
                resolve(<AMap.LngLat>result.locations[0]);
            } else {
                reject(result.info);
            }
        });
    });
}

export { loadAMap, convertGPS }