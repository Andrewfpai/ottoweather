// Sample QWeather responses for testing the QWeather code path without a key.
// Open index.html?mock=qweather to use them. Shapes follow the QWeather docs
// (v1 weather/air/alert, v7 daily, GeoAPI); the values are invented.
(() => {
  const TZ = "Asia/Shanghai";
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const hourOf = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" });
  const iso = (s) => new Date(s * 1000).toISOString().slice(0, 16) + "Z";
  const meta = { tag: "0".repeat(64), attributions: ["https://developer.qweather.com/attribution.html"] };
  const now = Math.floor(Date.now() / 1000), h0 = Math.floor(now / 3600) * 3600;

  function hourly(n) {
    const hours = [];
    for (let i = 0; i < n; i++) {
      const t = h0 + i * 3600, h = +hourOf.format(new Date(t * 1000)), day = Math.floor(i / 24);
      const temp = 17 + 6 * Math.sin(((h - 9) / 24) * 2 * Math.PI) - day * 0.4;
      const wet = i >= 30 && i < 44, night = h < 6 || h >= 18;
      const code = wet ? (i % 5 === 0 ? "306" : "305") : day % 3 === 2 ? "104" : night ? "151" : "101";
      hours.push({
        forecastTime: iso(t), condition: { text: wet ? "Light Rain" : code === "104" ? "Overcast" : "Cloudy", code },
        temperature: { value: +temp.toFixed(1), unit: "°C" }, feelsLike: { value: +(temp - 1).toFixed(1), unit: "°C" }, humidity: wet ? 0.92 : 0.66,
        wind: { direction: { degree: 90 + (i % 40), compass: "e" }, speed: { value: 2 + (i % 7) * 0.6, unit: "m/s" }, scale: 1 + (i % 7 > 3 ? 2 : 1) },
        windGust: { value: 6, unit: "m/s" },
        precipitation: { amount: { value: wet ? 1.2 : 0, unit: "mm" }, intensity: { value: wet ? 1.2 : 0, unit: "mm/h" }, probability: wet ? 0.9 : i % 9 === 0 ? 0.3 : 0.05, type: wet ? "rain" : "none" },
        pressure: { value: 1016, unit: "hPa" }, visibility: { value: 12000, unit: "m" }, dewPoint: { value: 11, unit: "°C" }, cloudCover: 0.8,
        uvIndex: night ? 0 : Math.max(0, Math.round(5 * Math.sin(((h - 6) / 12) * Math.PI))),
      });
    }
    return { metadata: meta, hours };
  }

  function daily(n) {
    const icons = ["101", "101", "306", "100", "101", "104", "100", "305", "101", "100"];
    const daily = [];
    for (let i = 0; i < n; i++) {
      const date = ymd.format(new Date((now + i * 86400) * 1000));
      const max = 25 - i * 0.5 + (i % 3), min = 12 - i * 0.3;
      const icon = icons[i % icons.length];
      daily.push({ fxDate: date, sunrise: "06:21", sunset: "17:31", moonrise: "15:02", moonset: "02:40", moonPhase: "Waxing Crescent", moonPhaseIcon: "801",
        tempMax: String(Math.round(max)), tempMin: String(Math.round(min)), iconDay: icon, textDay: icon === "100" ? "Sunny" : icon === "104" ? "Overcast" : icon.startsWith("3") ? "Rain" : "Cloudy",
        iconNight: icon === "100" ? "150" : "151", textNight: icon === "100" ? "Clear" : "Cloudy",
        wind360Day: String(80 + i * 10), windDirDay: "E", windScaleDay: "1-2", windSpeedDay: "9", wind360Night: "0", windDirNight: "N", windScaleNight: "1-2", windSpeedNight: "5",
        humidity: "68", precip: icon.startsWith("3") ? "12.4" : "0.0", pressure: "1017", vis: "20", cloud: "40", uvIndex: String(3 + (i % 3)) });
    }
    return { code: "200", updateTime: new Date().toISOString(), fxLink: "https://www.qweather.com/", daily, refer: { sources: ["https://developer.qweather.com/attribution.html"], license: ["QWeather Developers License"] } };
  }

  const cnIndex = (aqi) => {
    const lv = aqi <= 50 ? 1 : aqi <= 100 ? 2 : aqi <= 150 ? 3 : aqi <= 200 ? 4 : 5;
    const cat = ["", "Excellent", "Good", "Lightly Polluted", "Moderately Polluted", "Heavily Polluted"][lv];
    const col = [null, [0, 228, 0], [255, 255, 0], [255, 126, 0], [255, 0, 0], [153, 0, 76]][lv];
    return { code: "cn-mee-1h", name: "AQI-1H (CN)", aqi, aqiDisplay: String(aqi), level: String(lv), category: cat,
      color: { red: col[0], green: col[1], blue: col[2], alpha: 1 }, primaryPollutant: aqi > 50 ? { code: "pm10", name: "PM 10", fullName: "Inhalable particulate matter (<10µm)" } : null,
      health: { effect: "Sensitive people may have mild symptoms.", advice: { generalPopulation: "Children, the elderly and people with heart or lung disease should reduce long outdoor exercise.", sensitivePopulation: "Reduce outdoor activity." } } };
  };

  const RESP = {
    current: () => ({ metadata: meta, condition: { text: "Fog", code: "501" }, temperature: { value: 15, unit: "°C" }, feelsLike: { value: 15, unit: "°C" }, humidity: 0.86,
      wind: { direction: { degree: 95, compass: "e" }, speed: { value: 1.2, unit: "m/s" }, scale: 1 }, windGust: { value: 3, unit: "m/s" },
      precipitation: { amount: { value: 0, unit: "mm" }, intensity: { value: 0, unit: "mm/h" }, type: "none" }, pressure: { value: 1016, unit: "hPa" },
      visibility: { value: 900, unit: "m" }, dewPoint: { value: 12.7, unit: "°C" }, cloudCover: 0.9, uvIndex: 0 }),
    air: () => ({ metadata: meta, indexes: [cnIndex(117)], pollutants: [
      { code: "pm2p5", name: "PM 2.5", fullName: "Fine particulate matter (<2.5µm)", concentration: { value: 86, unit: "μg/m3" }, subIndexes: [{ code: "cn-mee-1h", aqi: 114, aqiDisplay: "114" }] },
      { code: "pm10", name: "PM 10", fullName: "Inhalable particulate matter (<10µm)", concentration: { value: 183, unit: "μg/m3" }, subIndexes: [{ code: "cn-mee-1h", aqi: 117, aqiDisplay: "117" }] }],
      stations: [{ id: "P0001", name: "Jinnan" }] }),
    airHourly: () => ({ metadata: meta, hours: Array.from({ length: 24 }, (_, i) => ({ forecastTime: iso(h0 + i * 3600), indexes: [cnIndex(Math.max(30, 117 - i * 4))], pollutants: [] })) }),
    alert: () => ({ metadata: { ...meta, zeroResult: false, attributions: [...meta.attributions, "Warnings may be delayed; the issuing office's release prevails."] },
      alerts: [{ id: "202610151030001234567890", senderName: "Tianjin Meteorological Observatory", issuedTime: "2026-10-15T10:30+08:00",
        messageType: { code: "alert", supersedes: [] }, eventType: { name: "Gale", code: "1006" }, urgency: null, severity: "minor", certainty: null, icon: "1006",
        color: { code: "blue", red: 30, green: 50, blue: 205, alpha: 1 }, effectiveTime: "2026-10-15T10:30+08:00", onsetTime: "2026-10-15T10:30+08:00", expireTime: "2026-10-16T10:30+08:00",
        headline: "Blue Warning for Gale", description: "Within 24 hours the average wind may reach force 6, or gusts force 7.", criteria: "", responseTypes: [],
        instruction: "1. Secure loose objects outdoors.\n2. Take care near scaffolding and billboards." }] }),
    geo: (q) => ({ code: "200", location: [{ name: q || "Nankai", id: "101030500", lat: "39.12", lon: "117.15", adm2: "Tianjin", adm1: "Tianjin", country: "China", tz: TZ, utcOffset: "+08:00", isDst: "0", type: "city", rank: "35", fxLink: "" }],
      refer: { sources: ["https://developer.qweather.com/attribution.html"], license: ["QWeather Developers License"] } }),
  };

  window.QW_MOCK = async (path) => {
    await new Promise((ok) => setTimeout(ok, 150));
    const [p, query] = path.split("?");
    const qs = new URLSearchParams(query || "");
    if (p.startsWith("/weather/v1/current")) return RESP.current();
    if (p.startsWith("/weather/v1/hourly")) return hourly(+qs.get("hours") || 24);
    if (p.startsWith("/v7/weather/")) return daily(parseInt(p.split("/").pop(), 10) || 7);
    if (p.startsWith("/airquality/v1/current")) return RESP.air();
    if (p.startsWith("/airquality/v1/hourly")) return RESP.airHourly();
    if (p.startsWith("/weatheralert/v1/current")) return RESP.alert();
    if (p.startsWith("/geo/v2/city/lookup")) return RESP.geo(qs.get("location"));
    throw new Error("404 Not Found · no sample for " + p);
  };
})();
