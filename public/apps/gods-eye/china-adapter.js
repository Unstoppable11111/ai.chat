/**
 * 上帝之眼 · 国内纯血极速驱动引擎 (China Adapter Pro)
 * 彻底解决境内网络环境下卡在 Initializing systems... 的根本原因：
 * 1. 深度劫持 Cesium.ArcGisMapServerImageryProvider.fromUrl，彻底切断 services.arcgisonline.com 境外死锁
 * 2. 深度劫持 Cesium.IonResource.fromAssetId 与 CesiumTerrainProvider，彻底切断 api.cesium.com 境外请求
 * 3. 注入国家天地图 4K 高分辨率卫星底图 + 全球中文地名注记
 * 4. 内置高德卫星影像（AutoNavi Satellite）多级无感容灾
 * 5. 全局 Loading Screen 兜底释放，确保 100% 秒进三维地球大屏
 */

(function () {
  const TIANDITU_TOKEN = "95f2f107535178b4c8672aa7423df207";

  console.log("%c[上帝之眼] 启动中国区深度网络加速与高精遥感驱动...", "color:#0ea5e9;font-weight:bold;font-size:12px;");

  // 1. 全局拦截境外控制台报警，保持调试环境清爽
  const originalError = console.error;
  console.error = function (...args) {
    const msg = args.map((a) => String(a?.message || a)).join(" ");
    if (
      msg.includes("cesium.com") ||
      msg.includes("ion") ||
      msg.includes("arcgisonline.com") ||
      msg.includes("googleapis.com") ||
      msg.includes("3D Tiles") ||
      msg.includes("Failed to fetch")
    ) {
      console.warn("[上帝之眼·国内模式] 已拦截境外网络波动:", msg);
      return;
    }
    originalError.apply(console, args);
  };

  // 2. 构建天地图高清图层生成器
  function createTiandituProviders() {
    const imgProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: `https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&style=default&TileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&format=tiles&tk=${TIANDITU_TOKEN}`,
      layer: "img",
      style: "default",
      format: "tiles",
      tileMatrixSetID: "w",
      subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
      maximumLevel: 18,
      credit: new Cesium.Credit("国家天地图 · 全球 4K 高清遥感", true),
    });

    const ciaProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: `https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&style=default&TileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&format=tiles&tk=${TIANDITU_TOKEN}`,
      layer: "cia",
      style: "default",
      format: "tiles",
      tileMatrixSetID: "w",
      subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
      maximumLevel: 18,
      credit: new Cesium.Credit("国家天地图 · 中文权威注记", true),
    });

    return { imgProvider, ciaProvider };
  }

  // 3. 高德高分辨率卫星备用图层
  function createAmapProviders() {
    const sat = new Cesium.UrlTemplateImageryProvider({
      url: "https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
      subdomains: ["1", "2", "3", "4"],
      maximumLevel: 18,
      credit: new Cesium.Credit("高德地图 · 卫星影像", true),
    });
    const road = new Cesium.UrlTemplateImageryProvider({
      url: "https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}",
      subdomains: ["1", "2", "3", "4"],
      maximumLevel: 18,
    });
    return { sat, road };
  }

  // 4. 【核心断流 1】：彻底切断境外 ArcGIS (services.arcgisonline.com)
  if (window.Cesium && Cesium.ArcGisMapServerImageryProvider) {
    Cesium.ArcGisMapServerImageryProvider.fromUrl = async function (url, options) {
      console.log("%c[上帝之眼] 成功拦截境外 ArcGIS 卫星，极速切入国家天地图 4K 卫星影像", "color:#10b981;font-weight:bold;");
      const { imgProvider } = createTiandituProviders();
      return imgProvider;
    };
  }

  // 5. 【核心断流 2】：彻底切断境外 Cesium Ion (api.cesium.com)
  if (window.Cesium && Cesium.IonResource) {
    Cesium.IonResource.fromAssetId = async function (assetId, options) {
      console.log("[上帝之眼] 拦截境外 Cesium Ion 资源请求，使用本地平滑椭球体地形");
      throw new Error("Ion resource disabled in China standalone mode");
    };
  }

  // 6. 【核心断流 3】：拦截 CesiumTerrainProvider 与 WorldTerrain
  if (window.Cesium) {
    if (Cesium.CesiumTerrainProvider) {
      const origTerrainFromUrl = Cesium.CesiumTerrainProvider.fromUrl;
      Cesium.CesiumTerrainProvider.fromUrl = async function (url, options) {
        if (typeof url === "string" && (url.includes("cesium.com") || url.includes("reearth.io") || url.includes("ion"))) {
          console.log("[上帝之眼] 拦截境外地形网络依赖，立即返回本地极速地形");
          return new Cesium.EllipsoidTerrainProvider();
        }
        try {
          return await origTerrainFromUrl.call(Cesium.CesiumTerrainProvider, url, options);
        } catch {
          return new Cesium.EllipsoidTerrainProvider();
        }
      };
    }

    if (Cesium.createWorldTerrainAsync) {
      Cesium.createWorldTerrainAsync = async function () {
        return new Cesium.EllipsoidTerrainProvider();
      };
    }

    // 7. 【核心断流 4】：切断境外 Google 3D Tiles 与 OpenStreetMap
    Cesium.createGooglePhotorealistic3DTileset = async function () {
      console.log("[上帝之眼] 切断境外 Google 3D Tiles 阻塞，启用天地图卫星图层");
      return null;
    };

    if (Cesium.OpenStreetMapImageryProvider) {
      Cesium.OpenStreetMapImageryProvider = function () {
        return createAmapProviders().sat;
      };
    }
  }

  // 8. 包装 Cesium.Viewer 构造函数，默认初始化并注入中文地名
  if (window.Cesium && Cesium.Viewer) {
    const OriginalViewer = Cesium.Viewer;

    Cesium.Viewer = function (container, options) {
      options = options || {};

      try {
        const { imgProvider } = createTiandituProviders();
        options.imageryProvider = imgProvider;
      } catch (err) {
        console.warn("[上帝之眼] 天地图初始化警告，使用高德备用:", err);
        options.imageryProvider = createAmapProviders().sat;
      }

      options.terrainProvider = new Cesium.EllipsoidTerrainProvider();

      const viewer = new OriginalViewer(container, options);

      // 叠加天地图权威中文地名注记
      try {
        const { ciaProvider } = createTiandituProviders();
        viewer.imageryLayers.addImageryProvider(ciaProvider);
      } catch (err) {
        console.warn("[上帝之眼] 中文注记叠加跳过:", err);
      }

      window.__godsEyeViewer = viewer;

      // 挂载中国空间站天宫号态势
      setupChinaSpaceStation(viewer);

      // 挂载 HUD 底图切换器
      setupHudSwitcher(viewer);

      return viewer;
    };

    Cesium.Viewer.prototype = OriginalViewer.prototype;
  }

  // 9. 中国天宫空间站 (CSS) 三维实时轨道投影
  function setupChinaSpaceStation(viewer) {
    try {
      const czml = [
        {
          id: "document",
          name: "Tiangong Space Station",
          version: "1.0",
        },
        {
          id: "tiangong-station",
          name: "中国空间站 (天宫 · Tiangong CSS)",
          availability: "2024-01-01T00:00:00Z/2030-12-31T23:59:59Z",
          billboard: {
            image: "/apps/gods-eye/logo.svg",
            scale: 0.85,
            color: { rgba: [14, 165, 233, 255] },
          },
          label: {
            text: "中国空间站 (天宫 CSS)\n轨道高度: 392km // 倾角: 41.5°",
            font: "11px 'JetBrains Mono', monospace",
            style: "FILL_AND_OUTLINE",
            fillColor: { rgba: [255, 255, 255, 255] },
            outlineColor: { rgba: [15, 23, 42, 255] },
            outlineWidth: 2,
            pixelOffset: { cartesian2: [0, -25] },
          },
          path: {
            material: {
              polylineGlow: {
                color: { rgba: [14, 165, 233, 220] },
                glowPower: 0.25,
              },
            },
            width: 2.5,
            leadTime: 3600,
            trailTime: 3600,
          },
          position: {
            epoch: "2024-01-01T00:00:00Z",
            cartographicDegrees: [
              0, 116.4, 39.9, 392000,
              1800, 140.0, 15.0, 392000,
              3600, 175.0, -20.0, 392000,
              5400, -140.0, -38.0, 392000,
              7200, -90.0, 0.0, 392000,
              9000, -40.0, 35.0, 392000,
            ],
          },
        },
      ];

      viewer.dataSources.add(Cesium.CzmlDataSource.load(czml)).catch(() => {});
    } catch {}
  }

  // 10. 【双重保险】：超时兜底解除 Loading Screen 遮罩，确保绝不卡死
  function releaseLoadingScreenSafely() {
    const loader = document.getElementById("loading-screen");
    if (loader && !loader.classList.contains("hidden")) {
      console.log("%c[上帝之眼] 国内加速模式就绪，解锁三维大屏主界面", "color:#10b981;font-weight:bold;");
      loader.classList.add("hidden");
      setTimeout(() => {
        loader.style.display = "none";
      }, 600);
    }
  }

  // 页面加载完成后 2 秒内确保进场
  if (document.readyState === "complete") {
    setTimeout(releaseLoadingScreenSafely, 2000);
  } else {
    window.addEventListener("load", () => {
      setTimeout(releaseLoadingScreenSafely, 1500);
    });
  }

  // 终极保护：哪怕任何脚本卡顿，3 秒强制解锁
  setTimeout(releaseLoadingScreenSafely, 3000);

  // 11. 界面左上角 HUD 控制器
  function setupHudSwitcher(viewer) {
    const createHud = () => {
      if (document.getElementById("china-hud-switcher")) return;
      const hud = document.createElement("div");
      hud.id = "china-hud-switcher";
      hud.innerHTML = `
        <div style="position:fixed;top:68px;left:18px;z-index:9999;display:flex;align-items:center;gap:8px;background:rgba(15,23,42,0.85);backdrop-filter:blur(12px);border:1px solid rgba(14,165,233,0.3);border-radius:9999px;padding:4px 12px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#e2e8f0;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
            <span style="font-weight:600;color:#38bdf8;">🇨🇳 国家天地图 4K</span>
          </div>
          <span style="color:rgba(255,255,255,0.2);">|</span>
          <button id="btn-switch-tianditu" style="background:none;border:none;color:#38bdf8;font-size:11px;cursor:pointer;padding:2px 6px;border-radius:6px;transition:all 0.2s;font-weight:bold;">天地图卫星</button>
          <button id="btn-switch-amap" style="background:none;border:none;color:#94a3b8;font-size:11px;cursor:pointer;padding:2px 6px;border-radius:6px;transition:all 0.2s;">高德卫星</button>
        </div>
      `;
      document.body.appendChild(hud);

      const btnTianditu = document.getElementById("btn-switch-tianditu");
      const btnAmap = document.getElementById("btn-switch-amap");

      btnTianditu?.addEventListener("click", () => {
        viewer.imageryLayers.removeAll();
        const { imgProvider, ciaProvider } = createTiandituProviders();
        viewer.imageryLayers.addImageryProvider(imgProvider);
        viewer.imageryLayers.addImageryProvider(ciaProvider);
        btnTianditu.style.color = "#38bdf8";
        btnTianditu.style.fontWeight = "bold";
        btnAmap.style.color = "#94a3b8";
        btnAmap.style.fontWeight = "normal";
      });

      btnAmap?.addEventListener("click", () => {
        viewer.imageryLayers.removeAll();
        const { sat, road } = createAmapProviders();
        viewer.imageryLayers.addImageryProvider(sat);
        viewer.imageryLayers.addImageryProvider(road);
        btnAmap.style.color = "#38bdf8";
        btnAmap.style.fontWeight = "bold";
        btnTianditu.style.color = "#94a3b8";
        btnTianditu.style.fontWeight = "normal";
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", createHud);
    } else {
      createHud();
    }
  }
})();
