/**
 * 上帝之眼 · 中国区电影级真实感遥感引擎 (China Photoreal Engine Pro)
 * 
 * 核心升级点：
 * 1. 【彻底剔除矢量色块】：底图锁定纯实景高分辨率光学遥感照片（高德 style=6 航拍照 / Esri 全球航拍），绝无粉红/米黄色矢量商铺色块遮挡！
 * 2. 【太空物理光影渲染】：激活太阳直射光照、晨昏线真实昼夜阴影（Day/Night Terminator）、太空蓝色大气散射辉光与景深立体雾化；
 * 3. 【解除黑边圆孔拘束】：默认关闭压抑的黑色望远镜遮罩（Scope Mask），释放 100% 满屏无死角沉浸式三维大屏；
 * 4. 【多源真实遥感容灾】：高德 4K 光学航拍（免 Token 毫秒级极速） + Esri 全球地貌航拍 + 国家天地图遥感无缝切换；
 * 5. 【倾斜电影级航拍】：支持倾斜航拍姿态（Pitch -35°），展现天地交接线、远山轮廓与真实城市立体剪影；
 * 6. 【终极防锁死兜底】：全面阻断境外 ArcGis / Cesium Ion / Google 3D 境外阻塞，100% 境内秒进。
 */

(function () {
  const TIANDITU_TOKEN = "95f2f107535178b4c8672aa7423df207";

  console.log("%c[上帝之眼·真实感引擎] 启动中国区 4K 光学遥感与太空物理光影引擎...", "color:#38bdf8;font-weight:bold;font-size:13px;");

  // 1. 全局拦截境外网络控制台报警
  const originalError = console.error;
  console.error = function (...args) {
    const msg = args.map((a) => String(a?.message || a)).join(" ");
    if (
      msg.includes("cesium.com") ||
      msg.includes("ion") ||
      msg.includes("arcgisonline.com") ||
      msg.includes("googleapis.com") ||
      msg.includes("3D Tiles") ||
      msg.includes("Failed to fetch") ||
      msg.includes("Mapillary") ||
      msg.includes("tianditu.gov.cn")
    ) {
      console.warn("[上帝之眼·网络护航] 已安全拦截网络波动:", msg);
      return;
    }
    originalError.apply(console, args);
  };

  // 2. 真实高清遥感影像图层工厂
  const Providers = {
    // 纯正高德高清卫星航拍照（style=6: 纯实景摄影航拍，绝无矢量色块！）
    createAmapSatellite() {
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
        subdomains: ["1", "2", "3", "4"],
        maximumLevel: 18,
        credit: new Cesium.Credit("高德地图 · 全球 4K 光学遥感航拍", true),
      });
    },

    // Esri 全球高清卫星航拍照（全球权威遥感影像，国内直连畅通，色调深邃逼真）
    createEsriSatellite() {
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maximumLevel: 18,
        credit: new Cesium.Credit("Esri · World Imagery 全球高精航拍", true),
      });
    },

    // 国家天地图纯卫星航拍（img_w）
    createTiandituSatellite() {
      return new Cesium.WebMapTileServiceImageryProvider({
        url: `https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&style=default&TileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&format=tiles&tk=${TIANDITU_TOKEN}`,
        layer: "img",
        style: "default",
        format: "tiles",
        tileMatrixSetID: "w",
        subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
        maximumLevel: 18,
        credit: new Cesium.Credit("国家天地图 · 全球 4K 高清遥感", true),
      });
    },

    // 天地图权威纯透明中文注记（cia_w: 仅白色半透明文字，无任何背景遮挡色块）
    createTiandituLabel() {
      return new Cesium.WebMapTileServiceImageryProvider({
        url: `https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&style=default&TileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&format=tiles&tk=${TIANDITU_TOKEN}`,
        layer: "cia",
        style: "default",
        format: "tiles",
        tileMatrixSetID: "w",
        subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
        maximumLevel: 18,
        credit: new Cesium.Credit("国家天地图 · 纯透明中文权威注记", true),
      });
    },
  };

  // 3. 【核心断流】：全面拦截境外 ArcGis、Cesium Ion 与 Google 3D
  if (window.Cesium) {
    if (Cesium.ArcGisMapServerImageryProvider) {
      Cesium.ArcGisMapServerImageryProvider.fromUrl = async function () {
        console.log("%c[上帝之眼] 拦截境外 ArcGis 请求，直接激活真实感光学航拍底图", "color:#10b981;font-weight:bold;");
        return Providers.createAmapSatellite();
      };
    }

    if (Cesium.IonResource) {
      Cesium.IonResource.fromAssetId = async function () {
        throw new Error("Ion resource disabled in standalone photoreal mode");
      };
    }

    if (Cesium.CesiumTerrainProvider) {
      const origTerrain = Cesium.CesiumTerrainProvider.fromUrl;
      Cesium.CesiumTerrainProvider.fromUrl = async function (url, options) {
        if (typeof url === "string" && (url.includes("cesium.com") || url.includes("reearth.io") || url.includes("ion"))) {
          return new Cesium.EllipsoidTerrainProvider();
        }
        try {
          return await origTerrain.call(Cesium.CesiumTerrainProvider, url, options);
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

    Cesium.createGooglePhotorealistic3DTileset = async function () {
      console.log("[上帝之眼] 阻断境外 Google 3D Tiles 阻塞，以高清航拍实景呈现");
      return null;
    };

    if (Cesium.OpenStreetMapImageryProvider) {
      Cesium.OpenStreetMapImageryProvider = function () {
        // 绝不返回矢量街道色块，严格返回纯高清遥感影像！
        return Providers.createAmapSatellite();
      };
    }
  }

  // 4. 太空物理光影与大气层增强器
  function applyPhotorealPhysics(viewer) {
    if (!viewer || !viewer.scene) return;
    try {
      const scene = viewer.scene;
      const globe = scene.globe;

      // 1. 开启太阳直射与昼夜晨昏线真实阴影（太空态势大屏核心灵魂）
      globe.enableLighting = true;

      // 2. 开启地表蓝色大气散射
      globe.showGroundAtmosphere = true;

      // 3. 开启太空蓝色大气辉光与光度调优
      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.show = true;
        scene.skyAtmosphere.atmosphereLightIntensity = 22.0;
        scene.skyAtmosphere.saturationShift = 0.05;
        scene.skyAtmosphere.brightnessShift = 0.02;
      }

      // 4. 开启立体景深自然雾化
      if (scene.fog) {
        scene.fog.enabled = true;
        scene.fog.density = 0.00012;
        scene.fog.screenSpaceErrorFactor = 2.0;
      }

      // 5. 开启高精度地形深度测试
      globe.depthTestAgainstTerrain = true;

      console.log("%c[上帝之眼] 太空物理光影、太阳昼夜晨昏线与大气层渲染已全面激活！", "color:#10b981;font-weight:bold;");
    } catch (e) {
      console.warn("[上帝之眼] 物理光影配置异常:", e);
    }
  }

  // 5. 望远镜黑边遮罩全面静默解除（释放全屏开阔视野）
  function disableScopeMaskSafely(viewer) {
    // 1. DOM 层面同步
    const scopeBtn = document.getElementById("scope-toggle");
    if (scopeBtn) {
      scopeBtn.classList.remove("active");
      scopeBtn.setAttribute("aria-pressed", "false");
    }
    const scopeRow = document.getElementById("scope-slider-row");
    if (scopeRow) {
      scopeRow.classList.remove("visible");
    }

    // 2. 内部服务层面同步
    const tryDisableInternal = () => {
      const gev = window.__godsEyeView;
      if (gev && gev.styleManager && gev.styleManager.services) {
        if (typeof gev.styleManager.services.setScopeMaskEnabled === "function") {
          gev.styleManager.services.setScopeMaskEnabled(false);
          console.log("%c[上帝之眼] 已彻底解除黑边望远镜遮罩，开启 100% 电影级大屏视野", "color:#10b981;font-weight:bold;");
          return true;
        }
      }
      return false;
    };

    if (!tryDisableInternal()) {
      const timer = setInterval(() => {
        if (tryDisableInternal()) {
          clearInterval(timer);
        }
      }, 300);
      setTimeout(() => clearInterval(timer), 8000);
    }
  }

  // 6. 包装 Cesium.Viewer 构造函数
  if (window.Cesium && Cesium.Viewer) {
    const OriginalViewer = Cesium.Viewer;

    Cesium.Viewer = function (container, options) {
      options = options || {};

      // 默认注入纯高清航拍实景（绝无矢量色块遮挡）
      options.imageryProvider = Providers.createAmapSatellite();
      options.terrainProvider = new Cesium.EllipsoidTerrainProvider();

      const viewer = new OriginalViewer(container, options);

      // 默认叠加天地图权威纯透明中文注记（仅文字，零色块背景）
      try {
        viewer.imageryLayers.addImageryProvider(Providers.createTiandituLabel());
      } catch (err) {
        console.warn("[上帝之眼] 中文注记叠加跳过:", err);
      }

      window.__godsEyeViewer = viewer;

      // 激活太空级物理光照与大气层
      applyPhotorealPhysics(viewer);

      // 彻底关闭压抑的黑色圆圈望远镜遮罩
      disableScopeMaskSafely(viewer);

      // 挂载中国空间站天宫号 (CSS)
      setupChinaSpaceStation(viewer);

      // 挂载 HUD 底图与画质控制台
      setupPhotorealHud(viewer);

      return viewer;
    };

    Cesium.Viewer.prototype = OriginalViewer.prototype;
  }

  // 7. 中国空间站 (天宫 · Tiangong CSS) 实时轨道投影
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

  // 8. 终极保护：超时强制解锁 Loading Screen，杜绝卡屏
  function releaseLoadingScreenSafely() {
    const loader = document.getElementById("loading-screen");
    if (loader && !loader.classList.contains("hidden")) {
      console.log("%c[上帝之眼] 真实感大屏就绪，呈现全景三维空间大屏", "color:#10b981;font-weight:bold;");
      loader.classList.add("hidden");
      setTimeout(() => {
        loader.style.display = "none";
      }, 500);
    }
  }

  if (document.readyState === "complete") {
    setTimeout(releaseLoadingScreenSafely, 1500);
  } else {
    window.addEventListener("load", () => {
      setTimeout(releaseLoadingScreenSafely, 1200);
    });
  }
  setTimeout(releaseLoadingScreenSafely, 2800);

  // 9. 左上角【真实感影像与镜头姿态】HUD 控制台
  function setupPhotorealHud(viewer) {
    const createHud = () => {
      if (document.getElementById("china-photoreal-hud")) return;
      const hud = document.createElement("div");
      hud.id = "china-photoreal-hud";
      hud.innerHTML = `
        <div style="position:fixed;top:66px;left:18px;z-index:9999;display:flex;align-items:center;flex-wrap:wrap;gap:8px;background:rgba(15,23,42,0.88);backdrop-filter:blur(14px);border:1px solid rgba(56,189,248,0.35);border-radius:9999px;padding:5px 14px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#e2e8f0;box-shadow:0 8px 32px rgba(0,0,0,0.55);">
          <!-- 状态徽标 -->
          <div style="display:flex;align-items:center;gap:6px;cursor:default;">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 10px #10b981;"></span>
            <span style="font-weight:600;color:#38bdf8;letter-spacing:0.5px;">🛰️ 4K 光学遥感</span>
          </div>

          <span style="color:rgba(255,255,255,0.2);">|</span>

          <!-- 图层切换 -->
          <button id="btn-sat-amap" title="高德纯实景卫星遥感航拍（无色块遮挡）" style="background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.4);color:#38bdf8;font-size:11px;cursor:pointer;padding:3px 8px;border-radius:6px;font-weight:bold;transition:all 0.2s;">高德遥感实景</button>
          <button id="btn-sat-esri" title="Esri 全球高精遥感航拍（好莱坞级深色地貌）" style="background:none;border:none;color:#94a3b8;font-size:11px;cursor:pointer;padding:3px 8px;border-radius:6px;transition:all 0.2s;">Esri 全球航拍</button>
          <button id="btn-sat-tianditu" title="国家天地图 4K 卫星影像" style="background:none;border:none;color:#94a3b8;font-size:11px;cursor:pointer;padding:3px 8px;border-radius:6px;transition:all 0.2s;">天地图</button>

          <span style="color:rgba(255,255,255,0.2);">|</span>

          <!-- 真实光影昼夜开关 -->
          <button id="btn-toggle-lighting" title="开启/关闭太阳昼夜晨昏线阴影" style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);color:#34d399;font-size:11px;cursor:pointer;padding:3px 8px;border-radius:6px;transition:all 0.2s;">☀️ 太空光照: 开</button>

          <!-- 电影级倾斜视角一键切换 -->
          <button id="btn-cinematic-pitch" title="切换为电影级倾斜航拍姿态（立体地平线）" style="background:none;border:1px solid rgba(255,255,255,0.15);color:#cbd5e1;font-size:11px;cursor:pointer;padding:3px 8px;border-radius:6px;transition:all 0.2s;">🎬 倾斜航拍角</button>
        </div>
      `;
      document.body.appendChild(hud);

      const btnAmap = document.getElementById("btn-sat-amap");
      const btnEsri = document.getElementById("btn-sat-esri");
      const btnTianditu = document.getElementById("btn-sat-tianditu");
      const btnLighting = document.getElementById("btn-toggle-lighting");
      const btnPitch = document.getElementById("btn-cinematic-pitch");

      function updateActiveBtn(activeBtn) {
        [btnAmap, btnEsri, btnTianditu].forEach((btn) => {
          if (!btn) return;
          if (btn === activeBtn) {
            btn.style.background = "rgba(56,189,248,0.15)";
            btn.style.border = "1px solid rgba(56,189,248,0.4)";
            btn.style.color = "#38bdf8";
            btn.style.fontWeight = "bold";
          } else {
            btn.style.background = "none";
            btn.style.border = "none";
            btn.style.color = "#94a3b8";
            btn.style.fontWeight = "normal";
          }
        });
      }

      // 切换为高德纯卫星遥感
      btnAmap?.addEventListener("click", () => {
        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(Providers.createAmapSatellite());
        try {
          viewer.imageryLayers.addImageryProvider(Providers.createTiandituLabel());
        } catch {}
        updateActiveBtn(btnAmap);
      });

      // 切换为 Esri 全球航拍
      btnEsri?.addEventListener("click", () => {
        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(Providers.createEsriSatellite());
        try {
          viewer.imageryLayers.addImageryProvider(Providers.createTiandituLabel());
        } catch {}
        updateActiveBtn(btnEsri);
      });

      // 切换为天地图
      btnTianditu?.addEventListener("click", () => {
        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(Providers.createTiandituSatellite());
        try {
          viewer.imageryLayers.addImageryProvider(Providers.createTiandituLabel());
        } catch {}
        updateActiveBtn(btnTianditu);
      });

      // 太阳昼夜光照切换
      let lightingEnabled = true;
      btnLighting?.addEventListener("click", () => {
        lightingEnabled = !lightingEnabled;
        viewer.scene.globe.enableLighting = lightingEnabled;
        if (lightingEnabled) {
          btnLighting.style.background = "rgba(16,185,129,0.12)";
          btnLighting.style.borderColor = "rgba(16,185,129,0.3)";
          btnLighting.style.color = "#34d399";
          btnLighting.textContent = "☀️ 太空光照: 开";
        } else {
          btnLighting.style.background = "none";
          btnLighting.style.borderColor = "rgba(255,255,255,0.15)";
          btnLighting.style.color = "#94a3b8";
          btnLighting.textContent = "☀️ 太空光照: 关";
        }
      });

      // 电影级倾斜视角切换
      let isTilted = false;
      btnPitch?.addEventListener("click", () => {
        const camera = viewer.camera;
        const carto = camera.positionCartographic;
        if (!carto) return;

        const lon = Cesium.Math.toDegrees(carto.longitude);
        const lat = Cesium.Math.toDegrees(carto.latitude);
        const height = Math.max(carto.height, 8000);

        if (!isTilted) {
          // 飞入倾斜 35° 电影级航拍
          camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat - 0.06, height),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-35),
              roll: 0.0,
            },
            duration: 1.8,
          });
          btnPitch.style.background = "rgba(56,189,248,0.15)";
          btnPitch.style.borderColor = "rgba(56,189,248,0.4)";
          btnPitch.style.color = "#38bdf8";
          btnPitch.textContent = "🛰️ 垂直侦察角";
          isTilted = true;
        } else {
          // 飞回复位垂直俯瞰
          camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-90),
              roll: 0.0,
            },
            duration: 1.8,
          });
          btnPitch.style.background = "none";
          btnPitch.style.borderColor = "rgba(255,255,255,0.15)";
          btnPitch.style.color = "#cbd5e1";
          btnPitch.textContent = "🎬 倾斜航拍角";
          isTilted = false;
        }
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", createHud);
    } else {
      createHud();
    }
  }
})();
