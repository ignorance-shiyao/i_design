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
  /*
   * 影调映射。没有它，高光一到 1.0 就直接削平成一片纯白，
   * 圆角上那道最该体现材质的滚边会糊成一块白斑。
   *
   * 用 Neutral 而不是常见的 ACES：ACES 是给电影调的，它会把饱和色往白里推，
   * 品牌蓝经它一过就成了灰扑扑的藕荷色——对一套「换个主色各端同时生效」的体系来说，
   * 主色在自家首屏上被渲染成另一个颜色是不能接受的。
   * Neutral（Khronos 的 PBR neutral）只压高光、不动色相饱和度。
   */
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1

  const scene = new THREE.Scene()

  /*
   * 环境贴图——这一块是整个场景「有没有质感」的分水岭。
   *
   * 只用平行光时，材质表面每一点的亮度只由「法线对着光的角度」决定，
   * 于是大平面上是一整片均匀的颜色，圆角上是一条生硬的明暗交界。
   * 那正是塑料玩具和橡皮泥的样子：它没有在反射任何东西。
   *
   * 真实物体的表面时刻在反射周围的环境，亮度沿着曲面连续变化，
   * 圆角上会拉出一条细长的高光——人判断「这是什么材质」靠的几乎全是这个。
   * 这里自己搭一间中性的灯棚，而不是用 three 自带的 RoomEnvironment：
   * 那间房里的光源是暖色的，白色面板反射出来会泛奶黄——
   * 而这套体系的面色就是 #ffffff，首屏上把它渲染成米色等于在说谎。
   * 自己搭还省掉一个外部 HDR 文件，不必为了好看多下载几百 KB。
   */
  const envScene = new THREE.Scene()
  envScene.background = new THREE.Color(0x2a2f3a)
  const panelLights: [number, number, number, number, number, number][] = [
    // [宽, 高, x, y, z, 亮度] —— 顶上一块大的定主高光，两侧各一块补出轮廓
    [10, 10, 0, 7, 0, 4.2],
    [6, 6, -6, 1.5, 2, 1.1],
    [6, 6, 6, 1, -1, 0.8],
    [10, 6, 0, 0, -7, 0.6]
  ]
  for (const [w, h, x, y, z, power] of panelLights) {
    const lightPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(power, power, power) })
    )
    lightPanel.position.set(x, y, z)
    lightPanel.lookAt(0, 0, 0)
    envScene.add(lightPanel)
  }
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(envScene, 0.04)
  scene.environment = envRT.texture
  pmrem.dispose()
  envScene.traverse((obj) => {
    const mesh = obj as Mesh
    if (mesh.isMesh) {
      mesh.geometry.dispose()
      ;(mesh.material as Material).dispose()
    }
  })

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100)
  /*
   * 机位要留出边距，不能贴着物体切。
   *
   * 上一版的取景把最上面两片切在画面外，看起来不是「叠得很高」，
   * 而是「这张图没放下」——溢出画框的物体一律读作事故，不读作纵深。
   * 现在按整摞的高度反推距离：可见高度约 4 个单位，内容占 2.9 个，
   * 上下各留半个单位的余量。
   */
  // 机位与朝向在 frameCamera() 里按包围盒算出来，见下
  const camDir = new THREE.Vector3(0.28, 0.62, 1).normalize()

  /*
   * 三点布光的简化版：一盏主光负责投影与体积，一盏补光把暗面提起来，
   * 再加一点环境光。只有主光投影——多一盏投影灯就多一遍阴影贴图，
   * 而这个场景里第二道影子只会让画面更脏。
   */
  /*
   * 有了环境贴图之后，环境光与补光都要收。
   *
   * 它们提供的是「各个方向一样亮」，而环境贴图提供的是「各个方向不一样亮」——
   * 后者才是形状的来源。两者叠加时，均匀的那份会把有方向的那份冲淡，
   * 结果是加了环境贴图却依然平。主光只留下来投影与定一个高光方向。
   */
  const key = new THREE.DirectionalLight(0xffffff, 1.15)
  /*
   * 主光偏顶而不是偏侧。
   *
   * 侧光把每一片的影子甩到旁边，这些影子落在地面上、又从基座边缘露出来，
   * 看着像多出来几块灰板——读者数不清到底有几片面板。
   * 压到接近正上方之后，影子收在各自下方，只剩「悬空」这一个信息。
   */
  key.position.set(1.6, 8.2, 3.0)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  // 影子边缘要软：硬边的影子在浅色底上读作实心物体，而不是影子
  key.shadow.radius = 4
  key.shadow.camera.near = 1
  key.shadow.camera.far = 20
  key.shadow.camera.left = -6
  key.shadow.camera.right = 6
  key.shadow.camera.top = 6
  key.shadow.camera.bottom = -6
  key.shadow.bias = -0.0012
  scene.add(key)

  // 补光比常规配比重一些：面板是浅色的，暗面一沉就显脏，而不是显立体
  const fill = new THREE.DirectionalLight(0xffffff, 0.25)
  fill.position.set(-4.5, 2.6, 3.4)
  scene.add(fill)

  const ambient = new THREE.AmbientLight(0xffffff, 0.12)
  scene.add(ambient)

  /*
   * 半球光：天顶一色、地面一色，朝上的面提亮、朝下的面压暗。
   *
   * 深色主题下非它不可。那时面板的材质色本来就是暗的（深色里的「浮起面」
   * 就是比页面亮一点点的深色），环境光是均匀的，乘上暗色还是暗——四片叠起来
   * 就是四块黑板。半球光只提朝上的面，形状立刻读得出来，
   * 而颜色仍然是令牌里那个值，没有为了好看去挑一个不属于这个语义的浅色。
   */
  const sky = new THREE.HemisphereLight(0xffffff, 0x000000, 0.25)
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
  /*
 * 圆角半径必须小于最短边的一半，否则圆角在中间对穿，棱上会出现一圈规则的缺口。
 * 那看着像模型坏了，而它既不报错也不会让构建失败。
 * 分段数给到 8：4 段时圆角本身是可见的折线，物体一放大就露馅。
 */
  const baseGeometry = new RoundedBoxGeometry(4.0, 0.34, 2.7, 8, 0.14)
  /*
   * 基座用 MeshPhysicalMaterial 而不是 Standard，为的是 clearcoat：
   * 它在本体着色之上再叠一层薄薄的清漆，圆角会因此拉出一道细而亮的高光。
   * 现实里的注塑件、烤漆件都有这一层，少了它，饱和的蓝就只是一块蓝色的橡皮。
   */
  const baseMaterial = new THREE.MeshPhysicalMaterial({
    roughness: 0.28,
    metalness: 0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.18
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = -0.72
  base.castShadow = true
  // 基座同样不接影：三片面板会在它的上表面印出三块硬边的灰
  base.receiveShadow = false
  group.add(base)

  // 面板加厚到 0.24：上一版厚 0.14、圆角 0.08，半径比半厚还大，
  // 棱上于是一路是缺口。加厚之后圆角合法，看起来也更像一块有份量的板子
  const panelGeometry = new RoundedBoxGeometry(2.35, 0.24, 1.6, 8, 0.1)
  const panels: { mesh: Mesh; material: MeshStandardMaterial; phase: number }[] = []
  /*
   * 三片，像摊开的一副牌那样错开，而不是四片紧紧摞着。
   *
   * 上一版是四片、层距 0.44——那个间距下每一片都落在下一片的正上方，
   * 中间两片于是整片处在别人的影子里，渲染出来是两块灰。那看着像没做完的占位物，
   * 而不是白色的面板。层数减到三、层距拉到 0.7，每两片之间才透得出光，
   * 各自的轮廓也才分得开。
   *
   * 横向同样要错开够：错开量小于半片时，正视图里它们的边缘几乎重合，
   * 读者看到的是一个模糊的多边形，而不是三个物体。
   */
  const layout = [
    { x: -0.78, y: 0.2, z: 0.42, rot: -0.06 },
    { x: 0.1, y: 0.9, z: 0.0, rot: 0.05 },
    { x: 0.92, y: 1.6, z: -0.44, rot: -0.04 }
  ]
  layout.forEach((spot, i) => {
    // 比基座光滑：浅色面板要能把补光反出来，否则叠在一起就是几块灰
    /*
     * 面板比基座更光滑一点：浅色表面要靠环境反射拉出的渐变来体现厚度，
     * 磨砂得太狠，反射被打散成一片均匀的灰，圆角就又没有形状了。
     */
    const material = new THREE.MeshPhysicalMaterial({
      roughness: 0.18,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.12
    })
    const mesh = new THREE.Mesh(panelGeometry, material)
    mesh.position.set(spot.x, spot.y, spot.z)
    mesh.rotation.y = spot.rot
    mesh.castShadow = true
    /*
     * 面板不接影——这一行是整个场景最要紧的一处。
     *
     * 面板互相接影时，每一片的上表面都印着上一片的影子，白色于是变成灰色，
     * 而且是一块边界僵硬的灰。它不会报错，也不会在任何检查里露出来，
     * 只是让整摞看起来脏。落影仍然有：它们照样往地面投，
     * 那一道才是真正提供「悬空」这个信息的影子。
     */
    mesh.receiveShadow = false
    group.add(mesh)
    panels.push({ mesh, material, phase: i * 1.6 })
  })

  /*
   * 接影平面：没有落影的物体像贴纸。
   * 用 ShadowMaterial 而不是一块灰色的地板——它只画影子本身，
   * 页面的背景色能原样透上来，换主题时不必再去调这块地板的颜色。
   */
  /*
   * 接影平面收到基座正下方一点点，并且把影子压得很淡。
   *
   * 影子在这里只负责回答「它们是悬空的吗」，不负责好看。浓一点的影子在浅色底上
   * 会立刻被读成一个实心物体——上一版正是如此：中间那片的影子从基座边缘探出来，
   * 看起来像第四块灰板。
   */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.15 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.9
  ground.receiveShadow = true
  scene.add(ground)

  function retheme() {
    const brand = token('--i-color-brand', '#5e7ce0')
    const surface = token('--i-color-bg-elevated', '#ffffff')
    const subtle = token('--i-color-brand-subtle', '#eef3ff')
    /*
     * 中间那片取品牌淡色与面色的中点，在这里算而不是写死一个色值——
     * 写死的那个值主题一换就不对了。
     *
     * 注意不能图省事写成 CSS 的 color-mix()：Color.setStyle 只认 #hex、
     * rgb()、hsl() 与颜色名，给它一个 color-mix() 字符串既不报错也不生效，
     * 那一片会保持上一次的颜色。
     */
    const mix = new THREE.Color(subtle).lerp(new THREE.Color(surface), 0.55)
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'

    baseMaterial.color.setStyle(brand)
    // 品牌色自发一点光：基座是「源头」，让它看起来在往上照
    baseMaterial.emissive.setStyle(brand)
    baseMaterial.emissiveIntensity = dark ? 0.22 : 0.08

    panels.forEach(({ material }, i) => {
      /*
       * 自下而上从品牌淡色过渡到中性面色。
       *
       * 只给最底下一片上色的话，另外两片完全同色，读起来是「两片一样的白板」；
       * 全部染成品牌色又看不出谁是源头。渐次退色才说得清方向：
       * 越靠近基座越带着它的颜色，越往上越回到各端自己的面色。
       */
      if (i === 1) material.color.copy(mix)
      else material.color.setStyle(i === 0 ? subtle : surface)
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
    sky.intensity = dark ? 0.7 : 0.25

    /*
     * 深色不是把灯调暗。
     *
     * 现实里房间变暗时物体也变暗，但屏幕上的深色主题是「底变暗、内容仍要看清」，
     * 照着现实调光会得到一张什么都看不见的图。这里反而要把光打足，
     * 让暗色的面靠高光和边缘读出体积。
     */
    ambient.intensity = dark ? 0.2 : 0.12
    key.intensity = dark ? 1.5 : 1.15
    fill.intensity = dark ? 0.4 : 0.25
    // 深色下把环境反射也收一点：白房间的反射在暗底上会让面板泛出一层灰白的膜
    scene.environmentIntensity = dark ? 0.45 : 1
    ;(ground.material as ShadowMaterial).opacity = dark ? 0.26 : 0.15
  }
  retheme()

  /*
   * 取景按包围盒算，不写死机位。
   *
   * 手调的那组坐标只在某一个画布尺寸下成立：画布一变窄，竖直方向就装不下，
   * 基座被切掉一截——而它在开发机的那个宽度上看着好好的。
   * 这里改成：量出整摞的包围盒，按当前视角与宽高比反推需要多远，
   * 于是任何尺寸下都留着同样的边距，改布局也不必再回来对一遍数字。
   */
  const fitBox = new THREE.Box3()
  const fitCenter = new THREE.Vector3()
  const fitCorner = new THREE.Vector3()

  function frameCamera() {
    group.updateWorldMatrix(true, true)
    fitBox.setFromObject(group)
    if (fitBox.isEmpty()) return
    fitBox.getCenter(fitCenter)

    const fovY = (camera.fov * Math.PI) / 180
    const tanY = Math.tan(fovY / 2)
    const tanX = tanY * camera.aspect

    /*
     * 把包围盒的八个角逐个投到相机空间里去量，而不是按「包围盒尺寸 ÷ 视角」估。
     *
     * 估算默认所有内容都落在过中心的那个平面上，可这摞东西有 2.7 个单位的进深：
     * 离镜头更近的那几个角张的角度更大，估出来的距离于是总是偏近，
     * 最靠前的基座前沿就被切在画面外——上一版正是这样，而且只在某些宽高比下露出来。
     *
     * 这里改成迭代：先按估算放一次，量出最挤的那个角超了多少，把距离乘上去，
     * 再量一次。两三轮就收敛，之后任何宽高比、任何布局都能保证整摞在画面内。
     */
    let distance = fitBox.getSize(fitCorner).length()
    for (let step = 0; step < 4; step++) {
      camera.position.copy(camDir).multiplyScalar(distance).add(fitCenter)
      camera.lookAt(fitCenter)
      camera.updateMatrixWorld()

      let worst = 0
      for (let i = 0; i < 8; i++) {
        fitCorner.set(
          i & 1 ? fitBox.max.x : fitBox.min.x,
          i & 2 ? fitBox.max.y : fitBox.min.y,
          i & 4 ? fitBox.max.z : fitBox.min.z
        )
        camera.worldToLocal(fitCorner)
        // 相机空间里视线朝 -z；角跑到镜头背后时这一项会失效，加个下限兜住
        const depth = Math.max(0.001, -fitCorner.z)
        worst = Math.max(worst, Math.abs(fitCorner.y) / depth / tanY, Math.abs(fitCorner.x) / depth / tanX)
      }
      if (worst <= 0) break
      distance *= worst
    }

    // 1.1 是留白系数：正好装满的构图看起来像被裁过，留出一点余量才像是摆好的
    camera.position.copy(camDir).multiplyScalar(distance * 1.1).add(fitCenter)
    camera.lookAt(fitCenter)
  }

  function resize() {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    renderer.setSize(rect.width, rect.height, false)
    camera.aspect = rect.width / rect.height
    camera.updateProjectionMatrix()
    frameCamera()
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
      envRT.dispose()
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
