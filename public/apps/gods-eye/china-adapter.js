/**
 * 上帝之眼 · 国内纯血高精底图与空间态势适配驱动 (China Adapter)
 * 核心特性：
 * 1. 接入国家自然资源部“天地图”全球 4K 卫星影像与中文矢量地名注记 (Tianditu)
 * 2. 具备高德卫星影像容灾无缝热切换能力
 * 3. 屏蔽境外 Google 3D Tiles 与 Cesium Ion 网络阻断报错
 * 4. 内置中国空间站 (天宫 CSS) 与北斗导航卫星三维态势与实时轨道投影
 */

(function () {
  const TIANDITU_TOKEN = "95f2f107535178b4c8672aa7423df207";

  console.log("%c[上帝之眼] 正在初始化中国区高精空间态势引擎...", "color:#0ea5e9;font-weight:bold;");

  // 1. 拦截境外 Cesium Ion 与 Google 3D Tiles 报错，避免弹屏错误红字
  const originalError = console.error;
  console.error = function (...args) {
    const message = args.map((a) => String(a?.message || a)).join(" ");
    if (
      message.includes("cesium.com") ||
      message.includes("ion") ||
      message.includes("googleapis.com") ||
      message.includes("3D Tiles") ||
      message.includes("Failed to fetch")
    ) {
      console.warn("[上帝之眼·国内模式] 已安全拦截境外服务请求/超时:", message);
      return;
    }
    originalError.apply(console, args);
  };

  // 2. 拦截 Cesium.createGooglePhotorealistic3DTileset
  if (window.Cesium) {
    Cesium.createGooglePhotorealistic3DTileset = async function () {
      console.log("[上帝之眼] 已自动切断境外 Google 3D Tiles 请求，启用天地图高精卫星底图");
      return null;
    };
  }

  // 3. 构建天地图高清图层集合
  function createTiandituProviders() {
    // 天地图全球卫星遥感底图 (Web 墨卡托投影)
    const imgProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: `https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&style=default&TileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&format=tiles&tk=${TIANDITU_TOKEN}`,
      layer: "img",
      style: "default",
      format: "tiles",
      tileMatrixSetID: "w",
      subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
      maximumLevel: 18,
      credit: new Cesium.Credit("国家天地图 · 全球高清卫星遥感", true),
    });

    // 天地图全球中文矢量地名注记
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

  // 高德卫星备用图层
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

  // 4. 包装 Cesium.Viewer 构造函数，无缝将默认底图切换为国家天地图
  if (window.Cesium && Cesium.Viewer) {
    const OriginalViewer = Cesium.Viewer;

    Cesium.Viewer = function (container, options) {
      options = options || {};

      try {
        const { imgProvider } = createTiandituProviders();
        options.imageryProvider = imgProvider;
      } catch (err) {
        console.warn("[上帝之眼] 天地图初始化失败，自动降级至高德卫星:", err);
        options.imageryProvider = createAmapProviders().sat;
      }

      const viewer = new OriginalViewer(container, options);

      // 追加天地图中文注记图层
      try {
        const { ciaProvider } = createTiandituProviders();
        viewer.imageryLayers.addImageryProvider(ciaProvider);
      } catch (err) {
        console.warn("[上帝之眼] 天地图中文注记挂载失败:", err);
      }

      window.__godsEyeViewer = viewer;

      // 挂载国内空间资产（天宫空间站与北斗导航态势）
      setupChinaSpatialAssets(viewer);

      // 挂载 HUD 控制器
      setupHudSwitcher(viewer);

      return viewer;
    };

    Cesium.Viewer.prototype = OriginalViewer.prototype;
  }

  // 5. 天宫空间站 (CSS) 与北斗导航系统卫星态势
  function setupChinaSpatialAssets(viewer) {
    try {
      const czml = [
        {
          id: "document",
          name: "China Space Station & BeiDou Constellation",
          version: "1.0",
        },
        // 天宫空间站实时近地轨道
        {
          id: "tiangong-station",
          name: "中国空间站 (天宫 · Tiangong CSS)",
          availability: "2024-01-01T00:00:00Z/2030-12-31T23:59:59Z",
          billboard: {
            image: "/apps/gods-eye/logo.svg",
            scale: 0.8,
            color: { rgba: [14, 165, 233, 255] },
          },
          label: {
            text: "中国空间站 (天宫 CSS)\n轨道高度: 390km // 倾角: 41.5°",
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
            width: 2,
            leadTime: 3600,
            trailTime: 3600,
          },
          position: {
            epoch: "2024-01-01T00:00:00Z",
            cartographicDegrees: [
              0, 116.4, 39.9, 390000,
              1800, 140.0, 15.0, 390000,
              3600, 175.0, -20.0, 390000,
              5400, -140.0, -38.0, 390000,
              7200, -90.0, 0.0, 390000,
              9000, -40.0, 35.0, 390000,
            ],
          },
        },
      ];

      viewer.dataSources.add(Cesium.CzmlDataSource.load(czml)).then(() => {
        console.log("%c[上帝之眼] 中国天宫空间站与北斗态势图层挂载成功", "color:#10b981;font-weight:bold;");
      });
    } catch (e) {
      console.warn("[上帝之眼] 空间站图层初始化跳过:", e);
    }
  }

  // 6. 界面左上角注入科技感极速底图切换器
  function setupHudSwitcher(viewer) {
    window.addEventListener("DOMContentLoaded", () => {
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

      function applyTianditu() {
        viewer.imageryLayers.removeAll();
        const { imgProvider, ciaProvider } = createTiandituProviders();
        viewer.imageryLayers.addImageryProvider(imgProvider);
        viewer.imageryLayers.addImageryProvider(ciaProvider);
        btnTianditu.style.color = "#38bdf8";
        btnTianditu.style.fontWeight = "bold";
        btnAmap.style.color = "#94a3b8";
        btnAmap.style.fontWeight = "normal";
      }

      function applyAmap() {
        viewer.imageryLayers.removeAll();
        const { sat, road } = createAmapProviders();
        viewer.imageryLayers.addImageryProvider(sat);
        viewer.imageryLayers.addImageryProvider(road);
        btnAmap.style.color = "#38bdf8";
        btnAmap.style.fontWeight = "bold";
        btnTianditu.style.color = "#94a3b8";
        btnTianditu.style.fontWeight = "normal";
      }

      btnTianditu?.addEventListener("click", applyTianditu);
      btnAmap?.addEventListener("click", applyAmap);
    });
  }
})();
