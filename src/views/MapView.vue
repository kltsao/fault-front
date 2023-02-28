<script setup lang="ts">
import { shallowRef, onMounted } from 'vue';
import axios from 'axios'
import "@amap/amap-jsapi-types";
import { loadAMap, convertGPS } from "../utils/amap";

const map = shallowRef<any>(null);

const getFaultsOLTs = async () => {
    const response = await axios.get('http://222.175.110.137:8000/faults/pon_no_sig');
    const olts: any[] = []
    let last_dev = ""
    response.data.forEach((alarm: any) => {
        if (alarm.device_name != last_dev) {
            last_dev = alarm.device_name;
            let olt = {
                device_ip: alarm.device_ip,
                name: alarm.device_name,
                longitude: alarm.longitude,
                latitude: alarm.latitude,
                amap_long: alarm.amap_long,
                amap_lat: alarm.amap_lat,
                jifang_name: alarm.jifang_name,
                pons: <any>[]
            };
            olt.pons.push({
                name: alarm.position_short,
                obds: alarm.obds
            });
            olts.push(olt);
        } else {
            olts[olts.length - 1].pons.push({
                name: alarm.position_short,
                obds: alarm.obds
            })
        }
    });
    return olts;
}

const drawFaults = async () => {
    const olts = await getFaultsOLTs();
    olts.forEach(async (olt) => {
        let pos: AMap.LngLat;
        if (olt.amap_long == null || olt.amap_lat == null) {
            pos = await convertGPS([olt.longitude, olt.latitude]);
            axios.post("http://222.175.110.137:8000/faults/olt_amap_lnglat/" + olt.device_ip,
                {
                    lng: pos.lng,
                    lat: pos.lat
                }).then((res) => {
                    console.log(res.data);
                });
        }
        else pos = new AMap.LngLat(olt.amap_long, olt.amap_lat);
        let marker = new AMap.Marker({
            position: pos,
            label: {
                content: olt.name,
            }
        });
        map.value.add(marker);
        console.log(olt);
        olt.pons.forEach((pon: any) => {
            pon.obds.forEach(async (obd: any) => {
                if (obd.upper_obd_name == '-') {
                    let obdpos: AMap.LngLat;
                    if (obd.amap_long && obd.amap_lat) obdpos = new AMap.LngLat(obd.amap_long, obd.amap_lat);
                    else {
                        obdpos = await convertGPS([obd.long, obd.lat]);
                        axios.post("http://222.175.110.137:8000/faults/obd_amap_lnglat/" + obd.id,
                            {
                                lng: obdpos.lng,
                                lat: obdpos.lat
                            }).then((res) => {
                                console.log(res.data);
                            });
                    }
                    let obdMarker = new AMap.Marker({
                        position: obdpos,
                        label: {
                            content: pon.name+'<br />'+obd.name
                        }
                    });
                    let linepath = [
                        pos,
                        obdpos
                    ];
                    let obdline = new AMap.Polyline({
                        path: linepath,
                        strokeColor: "red",
                        strokeStyle: "dashed"
                    });
                    map.value.add(obdMarker);
                    map.value.add(obdline);
                }
            });
        });
    });
}

const initMap = async () => {
    await loadAMap();
    let gps: [number, number] = [117.07317352294922, 36.65242004394531]
    map.value = new AMap.Map("map_container", {
        viewMode: "3D",
        zoom: 10,
        center: gps
    });
    drawFaults();
}

onMounted(() => {
    initMap();
});
</script>

<template>
    <div id="map_container"></div>
</template>

<style>
#map_container {
    width: 100%;
    height: 100%;
}
</style>