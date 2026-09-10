/**
 * 首屏的三维场景：一块令牌基座，几片浮在上面的端面板。
 *
 * 为什么值得为它引入 three.js——而 ValueCube 至今仍是 CSS 立方体：
 * 一个会转的立方体，CSS 的 preserve-3d 就能做，为它背一个三维运行时不划算。
 * 这里不一样：所有材质的颜色都从 CSS 令牌里读，主题一换、品牌色一调，
 * 场景当场重新上色。它演的正是首屏那句话本身——「换一个主色，各端同时生效」，
 * 一张静态插画演不出来。
 *
 * 逻辑单独放在 .ts 里而不是塞进 .vue：three 的引入是动态的，
 * 打包器会把这一整块切成独立 chunk，没滚到首屏、或者机器不支持 WebGL 时，
 * 这些字节根本不会下载。
 */

/*
 * 类型从 three 里 import type，而不是用全局 THREE 命名空间：
 * 运行时的 import 是动态的（要切成独立 chunk），只有类型引入是纯编译期的，
 * 不会把 three 拉回主包。
 */
import type {
  Mesh,
  MeshStandardMaterial,
  ShadowMaterial,
  Material
} from 'three'

export interface SceneHandle {
  dispose(): void
  /** 重新从 CSS 令牌读色并上色 */
  retheme(): void
  /** 指针位置，归一化到 [-1, 1] */
  point(x: number, y: number): void
  setPaused(paused: boolean): void
}

/** 从 :root 上读一个令牌。读不到就用兜底色，绝不让场景变成一团黑 */
function token(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export async function createTokenScene(
  canvas: HTMLCanvasElement,
  options: { reducedMotion: boolean }
): Promise<SceneHandle | null> {
  const THREE = await import('three')
  const { RoundedBoxGeometry } = await import(
    'three/examples/jsm/geometries/RoundedBoxGeometry.js'
  )

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power'
  })
  // 像素比封到 2：再高肉眼分辨不出，代价是像素量翻倍，低端笔记本上直接掉帧
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
  camera.position.set(0.2, 3.9, 9.4)
  // 看向堆叠的中段而不是基座：镜头对准哪里，视线就落在哪里，
  // 对准基座会让上面几片显得是溢出画面的多余物
  camera.lookAt(0, 0.75, 0)

  /*
   * 三点布光的简化版：一盏主光负责投影与体积，一盏补光把暗面提起来，
   * 再加一点环境光。只有主光投影——多一盏投影灯就多一遍阴影贴图，
   * 而这个场景里第二道影子只会让画面更脏。
   */
  const key = new THREE.DirectionalLight(0xffffff, 2.1)
  key.position.set(3.2, 6.4, 4.2)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 1
  key.shadow.camera.far = 20
  key.shadow.camera.left = -6
  key.shadow.camera.right = 6
  key.shadow.camera.top = 6
  key.shadow.camera.bottom = -6
  key.shadow.bias = -0.0012
  scene.add(key)

  // 补光比常规配比重一些：面板是浅色的，暗面一沉就显脏，而不是显立体
  const fill = new THREE.DirectionalLight(0xffffff, 0.9)
  fill.position.set(-4.5, 2.6, 3.4)
  scene.add(fill)

  const ambient = new THREE.AmbientLight(0xffffff, 0.85)
  scene.add(ambient)

  /*
   * 半球光：天顶一色、地面一色，朝上的面提亮、朝下的面压暗。
   *
   * 深色主题下非它不可。那时面板的材质色本来就是暗的（深色里的「浮起面」
   * 就是比页面亮一点点的深色），环境光是均匀的，乘上暗色还是暗——四片叠起来
   * 就是四块黑板。半球光只提朝上的面，形状立刻读得出来，
   * 而颜色仍然是令牌里那个值，没有为了好看去挑一个不属于这个语义的浅色。
   */
  const sky = new THREE.HemisphereLight(0xffffff, 0x000000, 0.6)
  sky.position.set(0, 6, 0)
  scene.add(sky)

  const group = new THREE.Group()
  scene.add(group)

  /*
   * 基座 = 令牌层，四片面板 = 消费它的各端。
   *
   * 面板不带任何标签文字：写上端名就成了一张需要翻译的图，
   * 而它要表达的只是「同一个来源，若干层消费者」这个结构本身。
   * 形状用圆角盒而不是纯立方体——这套体系里没有一个直角控件。
   */
  const baseGeometry = new RoundedBoxGeometry(4.6, 0.42, 3.1, 4, 0.16)
  const baseMaterial = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.04 })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = -0.55
  base.castShadow = true
  base.receiveShadow = true
  group.add(base)

  const panelGeometry = new RoundedBoxGeometry(2.5, 0.16, 1.72, 4, 0.09)
  const panels: { mesh: Mesh; material: MeshStandardMaterial; phase: number }[] = []
  /*
   * 逐层向上、交替错开，而不是随机散布。
   *
   * 散布看起来是「一堆板子」；规则地错开才读得出「同一个来源，一层层往上」。
   * 错开量控制在半片以内——错太多就断开成了几个互不相干的物体。
   */
  const layout = [
    { x: -0.62, y: 0.12, z: 0.34, rot: -0.05 },
    { x: 0.34, y: 0.56, z: 0.02, rot: 0.04 },
    { x: -0.34, y: 1.0, z: -0.3, rot: -0.03 },
    { x: 0.55, y: 1.44, z: -0.62, rot: 0.06 }
  ]
  layout.forEach((spot, i) => {
    // 比基座光滑：浅色面板要能把补光反出来，否则四片叠在一起就是四块灰
    const material = new THREE.MeshStandardMaterial({ roughness: 0.22, metalness: 0.02 })
    const mesh = new THREE.Mesh(panelGeometry, material)
    mesh.position.set(spot.x, spot.y, spot.z)
    mesh.rotation.y = spot.rot
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    panels.push({ mesh, material, phase: i * 1.4 })
  })

  /*
   * 接影平面：没有落影的物体像贴纸。
   * 用 ShadowMaterial 而不是一块灰色的地板——它只画影子本身，
   * 页面的背景色能原样透上来，换主题时不必再去调这块地板的颜色。
   */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.16 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.8
  ground.receiveShadow = true
  scene.add(ground)

  function retheme() {
    const brand = token('--i-color-brand', '#5e7ce0')
    const surface = token('--i-color-bg-elevated', '#ffffff')
    const subtle = token('--i-color-brand-subtle', '#eef3ff')
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'

    baseMaterial.color.setStyle(brand)
    // 品牌色自发一点光：基座是「源头」，让它看起来在往上照
    baseMaterial.emissive.setStyle(brand)
    baseMaterial.emissiveIntensity = dark ? 0.22 : 0.08

    panels.forEach(({ material }, i) => {
      // 只有最靠近基座的那片染上品牌淡色，越往上越回到中性面色：
      // 全部染成品牌色就看不出「谁是源头」了
      material.color.setStyle(i === 0 ? subtle : surface)
      /*
       * 深色下不去「提亮」面板，而是给它一圈品牌色的自发光。
       *
       * 深色主题的浮起面令牌是 #1f2431，亮度只有一成——它当材质色时，
       * 无论怎么加光都反射不出多少，四片叠起来还是四块黑板。
       * 这不是布光的问题，是这个值本来就该这么暗。
       *
       * 所以换一条路：深色下靠边缘而不是靠明度来定义形状。圆角把这点自发光
       * 收成一道细边，每片的轮廓立刻清楚，颜色也仍然出自令牌，
       * 没有为了好看去挑一个不属于这个语义的浅色。
       */
      material.emissive.setStyle(dark ? brand : surface)
      material.emissiveIntensity = dark ? 0.36 : 0
    })

    // 天顶用面色、地面用品牌色：朝上的面被面色提亮，朝下的面染上一点基座的反光
    sky.color.setStyle(surface)
    sky.groundColor.setStyle(brand)
    sky.intensity = dark ? 1.4 : 0.55

    /*
     * 深色不是把灯调暗。
     *
     * 现实里房间变暗时物体也变暗，但屏幕上的深色主题是「底变暗、内容仍要看清」，
     * 照着现实调光会得到一张什么都看不见的图。这里反而要把光打足，
     * 让暗色的面靠高光和边缘读出体积。
     */
    ambient.intensity = dark ? 0.5 : 0.85
    key.intensity = dark ? 2.6 : 2.1
    fill.intensity = dark ? 1.15 : 0.9
    ;(ground.material as ShadowMaterial).opacity = dark ? 0.34 : 0.12
  }
  retheme()

  function resize() {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    renderer.setSize(rect.width, rect.height, false)
    camera.aspect = rect.width / rect.height
    camera.updateProjectionMatrix()
  }
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)

  const pointer = { x: 0, y: 0 }
  const eased = { x: 0, y: 0 }
  let paused = false
  let frame = 0
  const started = performance.now()

  function render(now: number) {
    frame = requestAnimationFrame(render)
    if (paused) return

    // 指针跟随做缓动，不直接赋值：直接赋值时鼠标一抖，整个场景跟着抖
    eased.x += (pointer.x - eased.x) * 0.06
    eased.y += (pointer.y - eased.y) * 0.06
    group.rotation.y = eased.x * 0.32
    group.rotation.x = -eased.y * 0.16

    /*
     * 面板极缓慢地上下浮动。振幅只有 0.02——
     * 再大就成了「在动的装饰」，而这里要的是「有厚度、活着」的观感。
     */
    const t = (now - started) / 1000
    panels.forEach(({ mesh, phase }, i) => {
      mesh.position.y = layout[i].y + Math.sin(t * 0.5 + phase) * 0.02
    })

    renderer.render(scene, camera)
  }

  if (options.reducedMotion) {
    // 只画一帧：静止的场景仍然有体积与光影，只是不再动
    renderer.render(scene, camera)
  } else {
    frame = requestAnimationFrame(render)
  }

  return {
    dispose() {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
      baseGeometry.dispose()
      panelGeometry.dispose()
      baseMaterial.dispose()
      panels.forEach(({ material }) => material.dispose())
      ground.geometry.dispose()
      ;(ground.material as Material).dispose()
      renderer.dispose()
    },
    retheme,
    point(x, y) {
      pointer.x = x
      pointer.y = y
    },
    setPaused(next) {
      paused = next
    }
  }
}
