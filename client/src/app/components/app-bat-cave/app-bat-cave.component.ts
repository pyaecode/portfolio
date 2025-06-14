import {AfterViewInit, Component, ElementRef, OnDestroy, signal, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {gsap} from 'gsap';
import {AppBatConsoleComponent} from '../app-bat-console/app-bat-console.component';
import {AppBatBioComponent} from '../app-bat-bio/app-bat-bio.component';
import {AppBatWorkComponent} from '../app-bat-work/app-bat-work.component';
import {WorkExperienceService} from '../../services/work-experience.service';
import {LoadingService} from '../../services/loading.service';
import {BatRevealService} from '../../services/bat-reveal.service';
import {BatcaveInteractionService} from '../../services/batcave-interaction.service';
import {APP_CONFIG} from '../../constants/app.constants';

@Component({
  selector: 'app-bat-cave',
  imports: [AppBatConsoleComponent, AppBatBioComponent, AppBatWorkComponent],
  templateUrl: './app-bat-cave.component.html',
  styleUrl: './app-bat-cave.component.scss'
})
export class AppBatCaveComponent implements AfterViewInit, OnDestroy {
  @ViewChild('batcaveCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('batConsole', { static: false }) batConsoleComponent!: AppBatConsoleComponent;
  @ViewChild('batBio', { static: false }) batBioComponent!: AppBatBioComponent;
  @ViewChild('batWork', { static: false }) batWorkComponent!: AppBatWorkComponent;

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationId!: number;
  private batcaveModel!: THREE.Group;

  private mixer!: THREE.AnimationMixer;
  private animations: THREE.AnimationClip[] = [];
  private clock = new THREE.Clock();

  private lastLoggedProgress = 0;

  private resizeObserver?: ResizeObserver;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private sceneLights: THREE.Light[] = [];
  private lightActivationTimeline?: gsap.core.Timeline;
  private batmobile!: THREE.Object3D;
  private batwing!: THREE.Object3D;
  private batbike!: THREE.Object3D;
  private batmobileDisc!: THREE.Object3D;
  private batvehiclesPlatform!: THREE.Object3D;
  private batCowl!: THREE.Object3D;
  private batCowlDesk!: THREE.Object3D;
  private batCowlCamera!: THREE.Camera;
  private batConsole!: THREE.Object3D;
  private batConsoleCamera!: THREE.Camera;
  private batvehiclesCamera!: THREE.Camera;

  private mainCameraState = {
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    target: new THREE.Vector3(),
    fov: 45,
    near: 0.1,
    far: 1000
  };
  private cameraTransitionTimeline?: gsap.core.Timeline;
  private isTransitioning = false;
  private currentCameraMode: 'main' | 'batcowl' | 'batconsole' | 'batvehicles' = 'main';

  private clickableObjects: THREE.Object3D[] = [];
  private highlightLights = new Map<THREE.Object3D, THREE.PointLight>();
  private originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private highlightTimeline?: gsap.core.Timeline;
  private highlightTimeout?: number;
  private userInteractionDetected = false;
  private highlightsHaveBeenShown = false;
  private userInteractionListenersSetup = false;
  private highlightDisableDebounceTimeout?: number;
  private readonly HIGHLIGHT_DISABLE_DEBOUNCE_MS = 1000;
  private readonly HIGHLIGHT_PULSE_DURATION = 1.5;

  private boundOnWindowResize = this.onWindowResize.bind(this);
  private boundOnMouseClick = this.onMouseClick.bind(this);
  private boundOnUserInteraction = this.onUserInteraction.bind(this);
  private boundOnKeyDown = this.onKeyDown.bind(this);

  constructor(
    private workExperienceService: WorkExperienceService,
    private loadingService: LoadingService,
    private batRevealService: BatRevealService,
    private batcaveInteractionService: BatcaveInteractionService
  ) {}

  ngAfterViewInit(): void {
    if (!this.canvasRef?.nativeElement) {
      console.error('Canvas element not found!');
      return;
    }

    this.initThreeJS();
    this.setupOrbitControls();
    this.setupClickHandler();
    this.setupUserInteractionListeners();
    this.setupKeyboardListeners();
    this.loadBatcaveModel();
    this.animate();
    this.setupResizeListener();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.batcaveModel);
    }

    if (this.lightActivationTimeline) {
      this.lightActivationTimeline.kill();
    }

    if (this.highlightTimeline) {
      this.highlightTimeline.kill();
    }

    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
    }

    if (this.highlightDisableDebounceTimeout) {
      clearTimeout(this.highlightDisableDebounceTimeout);
    }

    if (this.cameraTransitionTimeline) {
      this.cameraTransitionTimeline.kill();
    }

    this.cleanupHighlights();

    this.controls.dispose();

    this.renderer.dispose();

    window.removeEventListener('resize', this.boundOnWindowResize);
    window.removeEventListener('keydown', this.boundOnKeyDown);

    this.resizeObserver?.disconnect();

    if (this.canvasRef?.nativeElement) {
      const canvas = this.canvasRef.nativeElement;
      canvas.removeEventListener('click', this.boundOnMouseClick);
      if (this.userInteractionListenersSetup) {
        canvas.removeEventListener('mousedown', this.boundOnUserInteraction);
        canvas.removeEventListener('touchstart', this.boundOnUserInteraction);
        canvas.removeEventListener('mousemove', this.boundOnUserInteraction);
        this.userInteractionListenersSetup = false;
      }
    }
  }

  private initThreeJS(): void {
    console.debug('Initializing Three.js scene for Batcave');

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000200);

    const canvas = this.canvasRef.nativeElement;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect);

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    console.debug('Three.js initialized. Canvas size:', canvas.clientWidth, 'x', canvas.clientHeight);
  }

  private setupOrbitControls(): void {
    this.controls = new OrbitControls(this.camera, this.canvasRef.nativeElement);

    this.controls.enablePan = false;

    this.controls.enableRotate = true;
    this.controls.touches.ONE = THREE.TOUCH.PAN
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;

    this.controls.enableZoom = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    console.debug('OrbitControls initialized with 2-finger rotation enabled, panning and zoom disabled');
  }

  private updateOrbitControlsForCameraMode(): void {
    if (!this.controls) return;

    switch (this.currentCameraMode) {
      case 'main':
      case 'batcowl':
      case 'batvehicles':
        this.controls.enableRotate = true;
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        console.debug(`OrbitControls updated for ${this.currentCameraMode} camera: rotation enabled, pan/zoom disabled`);
        break;

      case 'batconsole':
        this.controls.enableRotate = false;
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        console.debug('OrbitControls updated for batconsole camera: all controls disabled');
        break;
    }
  }

  private setupAnimations(): void {
    if (!this.batcaveModel || this.animations.length === 0) return;

    this.mixer = new THREE.AnimationMixer(this.batcaveModel);

    this.animations.forEach((clip, index) => {
      console.debug(`Animation ${index}: "${clip.name}" - Duration: ${clip.duration}s`);
    });

    this.playAllAnimations();
  }

  private playAllAnimations(): void {
    this.animations.forEach((clip) => {
      this.mixer.clipAction(clip).play();
      console.debug(`Playing animation: "${clip.name}"`);
    });
  }

  public loadBatcaveModel(): void {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/gltf/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.setMeshoptDecoder(MeshoptDecoder);

    this.lastLoggedProgress = 0;

    // Update loading status to indicate model loading has started
    this.loadingService.updateInitialProgress(0);

    console.debug('Loading Batcave model from:', APP_CONFIG.MODEL_PATH);

    loader.load(
      APP_CONFIG.MODEL_PATH,
      (gltf) => {
        console.debug('Batcave model loaded successfully');

        this.batcaveModel = gltf.scene;
        console.log(gltf)

        if (gltf.animations && gltf.animations.length > 0) {
          console.debug('Found animations:', gltf.animations.length);
          this.animations = gltf.animations;
          this.setupAnimations();
        } else {
          console.debug('No animations found in the model');
        }

        this.batcaveModel.scale.setScalar(1);
        this.batcaveModel.position.set(0, 0, 0);

        this.batcaveModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  if (mat.transparent && mat.opacity < 0.1) {
                    mat.opacity = 1.0;
                  }
                });
              } else {
                if (child.material.transparent && child.material.opacity < 0.1) {
                  child.material.opacity = 1.0;
                }
              }
            }
          }
        });



        this.scene.add(this.batcaveModel);
        this.isLoading.set(false);

        this.centerCameraOnModel();
        this.saveMainCameraState();

        this.discoverSceneLights();
        this.createStaggeredLightActivation();

        this.discoverObjectGroups();

        // Register this component with the interaction service
        this.batcaveInteractionService.registerBatcaveComponent(this);

        // Update status to show completion and hide loading screen
        this.loadingService.updateInitialStatus('Batcave Ready!');

        console.debug('Model added to scene. Camera position:', this.camera.position);

        // Trigger bat reveal animation immediately when model is ready
        setTimeout(() => {
          this.batRevealService.triggerBatReveal();
        }, 200);
      },
      (progress) => {
        const percentComplete = (progress.loaded / progress.total) * 100;

        // Update loading status with precise percentage
        this.loadingService.updateInitialProgress(percentComplete);

        const currentQuarter = Math.floor(percentComplete / 25) * 25;
        if (currentQuarter > this.lastLoggedProgress && currentQuarter >= 25) {
          console.debug(`Loading progress: ${percentComplete.toFixed(2)}%`);
          this.lastLoggedProgress = currentQuarter;
        }
      },
      (error) => {
        console.error('Error loading Batcave model:', error);
        console.error('Full error details:', error);
        this.errorMessage.set('Failed to load 3D model. Please check your connection and try again.');
        this.isLoading.set(false);
        this.batRevealService.triggerBatReveal();
      }
    );
  }

  private centerCameraOnModel(): void {
    if (!this.batcaveModel) return;

    const box = new THREE.Box3().setFromObject(this.batcaveModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim === 0) {
      console.warn('Model has zero size, using default camera position');
      this.camera.position.set(0, 2, 5);
      this.camera.lookAt(0, 0, 0);
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const fov = this.camera.fov * (Math.PI / 180);

    const fitHeightDistance = (size.y / 2) / Math.tan(fov / 2);
    const fitWidthDistance = (size.x / 2) / Math.tan(fov / 2) / aspect;
    let cameraDistance = Math.max(fitHeightDistance, fitWidthDistance);

    cameraDistance *= 1.05;

    cameraDistance = Math.max(cameraDistance, maxDim * 1.1);

    const newCameraPos = new THREE.Vector3(
      center.x + cameraDistance * 0.3,
      center.y + cameraDistance * 0.1,
      center.z + cameraDistance * 0.9
    );

    this.camera.position.copy(newCameraPos);
    this.camera.lookAt(center);

    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }
  }

  private saveMainCameraState(): void {
    this.mainCameraState.position.copy(this.camera.position);
    this.mainCameraState.rotation.copy(this.camera.rotation);
    if (this.controls) {
      this.mainCameraState.target.copy(this.controls.target);
    }
    this.mainCameraState.fov = this.camera.fov;
    this.mainCameraState.near = this.camera.near;
    this.mainCameraState.far = this.camera.far;

    console.debug('Main camera state saved:', {
      position: this.mainCameraState.position.toArray(),
      target: this.mainCameraState.target.toArray(),
      fov: this.mainCameraState.fov
    });
  }

  public returnToMainCamera(): void {
    if (this.isTransitioning) {
      console.debug('Camera transition already in progress, ignoring escape key');
      return;
    }

    if (this.batConsoleComponent && this.batConsoleComponent.isVisible()) {
      this.batConsoleComponent.hide();
    }

    if (this.batBioComponent && this.batBioComponent.isVisible()) {
      this.batBioComponent.hide();
    }

    if (this.batWorkComponent && this.batWorkComponent.isVisible()) {
      this.batWorkComponent.hide();
    }

    this.currentCameraMode = 'main';
    this.animateCameraTransition(
      this.mainCameraState.position,
      this.mainCameraState.rotation,
      this.mainCameraState.target,
      this.mainCameraState.fov,
      this.mainCameraState.near,
      this.mainCameraState.far,
      'main camera'
    );
  }

  private handleCameraTransitionComplete(cameraName: string): void {
    console.debug('Camera transition completed for:', cameraName);
    console.debug('Bat console component available:', !!this.batConsoleComponent);
    console.debug('Bat bio component available:', !!this.batBioComponent);
    console.debug('Bat work component available:', !!this.batWorkComponent);

    if (cameraName === 'batConsole camera' && this.batConsoleComponent) {
      console.debug('Showing bat console interface');
      this.batConsoleComponent.show();
    }

    if (cameraName === 'batCowl camera' && this.batBioComponent) {
      console.debug('Showing bat bio interface');
      this.batBioComponent.show();
    }

    if (cameraName === 'batVehicles camera' && this.batWorkComponent) {
      console.debug('Showing bat work experience interface');
      this.batWorkComponent.show();
    }
  }

  private animateCameraTransition(
    targetPosition: THREE.Vector3,
    targetRotation: THREE.Euler,
    targetControlsTarget: THREE.Vector3,
    targetFov: number,
    targetNear: number,
    targetFar: number,
    cameraName: string
  ): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    console.debug(`Starting animated transition to ${cameraName}`);

    if (this.cameraTransitionTimeline) {
      this.cameraTransitionTimeline.kill();
    }

    this.cameraTransitionTimeline = gsap.timeline({
      onComplete: () => {
        this.isTransitioning = false;
        this.updateOrbitControlsForCameraMode();
        this.handleCameraTransitionComplete(cameraName);
        console.debug(`Camera transition to ${cameraName} completed`);
      }
    });

    this.cameraTransitionTimeline.to(this.camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 1.5,
      ease: "power2.inOut"
    }, 0);

    this.cameraTransitionTimeline.to(this.camera.rotation, {
      x: targetRotation.x,
      y: targetRotation.y,
      z: targetRotation.z,
      duration: 1.5,
      ease: "power2.inOut"
    }, 0);

    this.cameraTransitionTimeline.to(this.camera, {
      fov: targetFov,
      near: targetNear,
      far: targetFar,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camera.updateProjectionMatrix();
      }
    }, 0);

    if (this.controls) {
      this.cameraTransitionTimeline.to(this.controls.target, {
        x: targetControlsTarget.x,
        y: targetControlsTarget.y,
        z: targetControlsTarget.z,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
          this.controls.update();
        }
      }, 0);
    }
  }



  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.batmobileDisc) {
      this.batmobileDisc.rotation.y += 0.01;
    }

    this.renderer.render(this.scene, this.camera);
  }
  private setupClickHandler(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('click', this.boundOnMouseClick);
  }

  private setupUserInteractionListeners(): void {
    if (this.userInteractionListenersSetup) {
      console.debug('User interaction listeners already set up, skipping');
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('mousedown', this.boundOnUserInteraction);
    canvas.addEventListener('touchstart', this.boundOnUserInteraction);
    canvas.addEventListener('mousemove', this.boundOnUserInteraction);
    this.userInteractionListenersSetup = true;
    console.debug('User interaction listeners set up for highlight detection');
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', this.boundOnKeyDown);
    console.debug('Keyboard listeners set up - ESC key will return to main camera view');
  }

  private onUserInteraction(): void {
    this.resetHighlightTimer();

    if (!this.userInteractionDetected) {
      console.debug('User interaction detected, setting up debounced disable');
      if (this.highlightDisableDebounceTimeout) {
        clearTimeout(this.highlightDisableDebounceTimeout);
      }

      this.highlightDisableDebounceTimeout = window.setTimeout(() => {
        this.userInteractionDetected = true;
        console.debug('Debounced user interaction confirmed, userInteractionDetected set to true');
        if (this.highlightsHaveBeenShown) {
          console.debug('Highlights have been shown, disabling them now');
          this.disableHighlights();
          // Notify UI overlay that highlights were disabled by user interaction
          this.batcaveInteractionService.notifyHighlightsDisabledByUserInteraction();
        } else {
          console.debug('Highlights not shown yet, will prevent activation');
        }
        this.highlightDisableDebounceTimeout = undefined;
      }, this.HIGHLIGHT_DISABLE_DEBOUNCE_MS);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      console.debug('Escape key pressed - returning to main camera view');
      this.returnToMainCamera();
    } else if (event.key === 'c' || event.key === 'C') {
      console.debug('C key pressed - testing console toggle');
      if (this.batConsoleComponent) {
        if (this.batConsoleComponent.isVisible()) {
          this.batConsoleComponent.hide();
        } else {
          this.batConsoleComponent.show();
        }
      } else {
        console.warn('Bat console component not available');
      }
    }
  }

  private onMouseClick(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      for (const intersect of intersects) {
        let object = intersect.object;

        while (object) {
          if (object === this.batmobile || object.name === 'batmobile') {
            console.debug('Clicked batmobile:', object);
            this.handleBatVehicleClick('batmobile');
            return;
          } else if (object === this.batwing || object.name === 'batwing') {
            console.debug('Clicked batwing:', object);
            this.handleBatVehicleClick('batwing');
            return;
          } else if (object === this.batbike || object.name === 'batbike') {
            console.debug('Clicked batbike:', object);
            this.handleBatVehicleClick('batbike');
            return;
          } else if (object === this.batCowl || object.name === 'batcowl') {
            console.debug('Clicked batCowl:', object);
            this.handleBatCowlClick();
            return;
          } else if (object === this.batCowlDesk || object.name === 'batcowl_desk') {
            console.debug('Clicked batCowlDesk:', object);
            this.handleBatCowlClick();
            return;
          } else if (object === this.batConsole || object.name === 'batconsole') {
            console.debug('Clicked batConsole:', object);
            this.handleBatConsoleClick();
            return;
          } else if (object.name === 'console_monitor_screens') {
            console.debug('Clicked console_monitor_screens:', object);
            this.handleBatMonitorsClick(intersect.face!);
            return;
          } else {
            // console.debug('Clicked on object:', object.name);
          }
          object = object.parent!;
        }
      }
    }
  }

  private setupResizeListener(): void {
    window.addEventListener('resize', this.boundOnWindowResize);

    if (this.canvasRef?.nativeElement) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const {} of entries) {
          setTimeout(() => this.onWindowResize(), 10);
        }
      });

      this.resizeObserver.observe(this.canvasRef.nativeElement.parentElement || this.canvasRef.nativeElement);
    }
  }

  public onWindowResize(): void {
    if (!this.canvasRef?.nativeElement || !this.camera || !this.renderer) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);

    if (this.batcaveModel) {
      this.centerCameraOnModel();
    }
  }

  private discoverObjectGroups(): void {
    console.debug('=== Discovering all objects in scene ===');
      this.batmobile = this.scene.getObjectByName('batmobile')!;
      if (this.batmobile) {
        this.clickableObjects.push(this.batmobile);
      } else {
        console.warn('batmobile object not found');
      }

      this.batwing = this.scene.getObjectByName('batwing')!;
      if (this.batwing) {
        this.clickableObjects.push(this.batwing);
      } else {
        console.warn('batwing object not found');
      }

      this.batbike = this.scene.getObjectByName('batbike')!;
      if (this.batbike) {
        this.clickableObjects.push(this.batbike);
      } else {
        console.warn('batbike object not found');
      }

    this.batmobileDisc = this.scene.getObjectByName('batmobile_disc')!;
    if (!this.batmobileDisc) {
      console.warn('batmobile_disc object not found in the scene');
    }

      this.batCowl = this.scene.getObjectByName('batcowl')!;
        this.clickableObjects.push(this.batCowl);
    if (!this.batCowl) {
      console.warn('batCowl object not found with any expected name');
    }

      this.batCowlDesk = this.scene.getObjectByName('batcowl_desk')!;
      if (this.batCowlDesk) {
        this.clickableObjects.push(this.batCowlDesk);
      } else {
        console.warn('batcowl_desk object not found');
      }

      this.batCowlCamera = this.scene.getObjectByName('batcowl_camera')! as THREE.Camera;
    if (!this.batCowlCamera) {
      console.warn('BatCowl camera not found');
    }

      this.batConsole = this.scene.getObjectByName('batconsole')!;
        this.clickableObjects.push(this.batConsole);
    if (!this.batConsole) {
      console.warn('BatConsole object not found');
    }

      this.batConsoleCamera = this.scene.getObjectByName('batconsole_camera')! as THREE.Camera;
    if (!this.batConsoleCamera) {
      console.warn('BatConsole camera not found');
    }

      this.batvehiclesCamera = this.scene.getObjectByName('batvehicles_camera')! as THREE.Camera;
    if (!this.batvehiclesCamera) {
      console.warn('Batvehicles camera not found');
    }
    this.createClickableHighlights();
  }

  private discoverSceneLights(): void {
    this.sceneLights = [];
    const roomLights: typeof this.sceneLights = [];

    this.scene.traverse((object) => {
      if (object instanceof THREE.Light) {
        if (object.name.includes('room')) {
          roomLights.push(object);
        } else {
          this.sceneLights.push(object);
        }
        console.debug(`Found light: ${object.type} "${object.name}" - Intensity: ${object.intensity}`);
      }
    });
    console.log(roomLights);
    this.sceneLights = roomLights.concat(this.sceneLights);

    console.debug(`Total lights discovered: ${this.sceneLights.length}`);
  }

  private createStaggeredLightActivation(): void {
    if (this.sceneLights.length === 0) {
      console.debug('No scene lights found to animate');
      return;
    }

    const originalIntensities = this.sceneLights.map(light => light.intensity);
    this.sceneLights.forEach(light => {
      light.intensity = 0;
    });

    const timeline = gsap.timeline({
      delay: 0.5,
      onComplete: () => {
        console.debug('Light activation sequence completed');
        this.scheduleHighlightActivation();
      }
    });
    this.lightActivationTimeline = timeline;

    this.sceneLights.forEach((light, index) => {
      const targetIntensity = originalIntensities[index];

      timeline.to(light, {
        intensity: targetIntensity,
        duration: 0.05,
        ease: "none",
        onStart: () => {
          console.debug(`Switching on light: ${light.type} "${light.name}" to intensity ${targetIntensity}`);
        }
      }, index);
    });

    console.debug('Light activation sequence started');
  }

  private handleBatVehicleClick(vehicleName?: string): void {
    console.debug('Clicked bat vehicle:', vehicleName || 'unknown', '- switching to batvehicles camera');

    if (this.currentCameraMode === 'batvehicles' && vehicleName) {
      this.showWorkExperienceForVehicle(vehicleName);
      return;
    }

    if (this.batvehiclesCamera) {
      this.switchToBatVehiclesCamera();
    } else {
      console.warn('Batvehicles camera not found in scene');
    }
  }

  private showWorkExperienceForVehicle(vehicleName: string): void {
    console.debug('Showing work experience for vehicle:', vehicleName);

    const workExperience = this.workExperienceService.getWorkExperienceByVehicle(vehicleName);

    if (workExperience) {
      this.workExperienceService.selectWorkExperience(workExperience.id);

      if (this.batWorkComponent) {
        this.batWorkComponent.show();
      } else {
        console.warn('Bat work component not available');
      }
    } else {
      console.warn('No work experience found for vehicle:', vehicleName);
    }
  }

  private handleBatCowlClick(): void {
    console.debug('Clicked batCowl - switching to batCowl camera');

    if (this.batCowlCamera) {
      this.switchToBatCowlCamera();
    } else {
      console.warn('BatCowl camera not found in scene');
    }
  }

  private handleBatConsoleClick(): void {
    console.debug('Bat console clicked - checking camera and component availability');
    console.debug('Bat console camera available:', !!this.batConsoleCamera);
    console.debug('Bat console component available:', !!this.batConsoleComponent);

    if (this.batConsoleCamera) {
      this.switchToBatConsoleCamera();
    } else {
      console.warn('BatConsole camera not found in scene');
      if (this.batConsoleComponent) {
        console.debug('Showing console as fallback');
        this.batConsoleComponent.show();
      }
    }
  }

  private handleBatMonitorsClick(face: THREE.Face): void {
    console.debug('Clicked console monitors - switching to batconsole camera', face);

    if (this.batConsoleCamera) {
      this.switchToBatConsoleCamera();
    } else {
      console.warn('BatConsole camera not found in scene');
      if (this.batConsoleComponent) {
        console.debug('Showing console as fallback');
        this.batConsoleComponent.show();
      }
    }
  }

  private switchToBatCowlCamera(): void {
    if (!this.batCowlCamera || this.isTransitioning) return;

    this.currentCameraMode = 'batcowl';

    const targetPosition = this.batCowlCamera.position.clone();
    const targetRotation = this.batCowlCamera.rotation.clone();

    const direction = new THREE.Vector3();
    this.batCowlCamera.getWorldDirection(direction);
    const targetControlsTarget = targetPosition.clone().add(direction.multiplyScalar(10));

    let targetFov = this.camera.fov;
    let targetNear = this.camera.near;
    let targetFar = this.camera.far;

    if (this.batCowlCamera instanceof THREE.PerspectiveCamera) {
      targetFov = this.batCowlCamera.fov;
      targetNear = this.batCowlCamera.near;
      targetFar = this.batCowlCamera.far;
    }

    this.animateCameraTransition(
      targetPosition,
      targetRotation,
      targetControlsTarget,
      targetFov,
      targetNear,
      targetFar,
      'batCowl camera'
    );
  }

  private switchToBatConsoleCamera(): void {
    if (!this.batConsoleCamera || this.isTransitioning) return;

    this.currentCameraMode = 'batconsole';

    const targetPosition = this.batConsoleCamera.position.clone();
    const targetRotation = this.batConsoleCamera.rotation.clone();

    const direction = new THREE.Vector3();
    this.batConsoleCamera.getWorldDirection(direction);
    const targetControlsTarget = targetPosition.clone().add(direction.multiplyScalar(10));

    let targetFov = this.camera.fov;
    let targetNear = this.camera.near;
    let targetFar = this.camera.far;

    if (this.batConsoleCamera instanceof THREE.PerspectiveCamera) {
      targetFov = this.batConsoleCamera.fov;
      targetNear = this.batConsoleCamera.near;
      targetFar = this.batConsoleCamera.far;
    }

    this.animateCameraTransition(
      targetPosition,
      targetRotation,
      targetControlsTarget,
      targetFov,
      targetNear,
      targetFar,
      'batConsole camera'
    );
  }

  private switchToBatVehiclesCamera(): void {
    if (!this.batvehiclesCamera || this.isTransitioning) return;

    this.currentCameraMode = 'batvehicles';

    const targetPosition = this.batvehiclesCamera.position.clone();
    const targetRotation = this.batvehiclesCamera.rotation.clone();

    const direction = new THREE.Vector3();
    this.batvehiclesCamera.getWorldDirection(direction);
    const targetControlsTarget = targetPosition.clone().add(direction.multiplyScalar(10));

    let targetFov = this.camera.fov;
    let targetNear = this.camera.near;
    let targetFar = this.camera.far;

    if (this.batvehiclesCamera instanceof THREE.PerspectiveCamera) {
      targetFov = this.batvehiclesCamera.fov;
      targetNear = this.batvehiclesCamera.near;
      targetFar = this.batvehiclesCamera.far;
    }

    this.animateCameraTransition(
      targetPosition,
      targetRotation,
      targetControlsTarget,
      targetFov,
      targetNear,
      targetFar,
      'batVehicles camera'
    );
  }

  private scheduleHighlightActivation(): void {
    if (this.userInteractionDetected) {
      console.debug('User interaction detected, skipping highlight activation');
      return;
    }

    const lightSequenceDuration = (this.sceneLights.length * 50) + 500;
    const bufferTime = 3000;
    const totalDelay = lightSequenceDuration + bufferTime;

    this.highlightTimeout = window.setTimeout(() => {
      if (!this.userInteractionDetected) {
        this.activateHighlights();
      }
    }, totalDelay);
  }

  private resetHighlightTimer(): void {
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = undefined;
    }

    this.userInteractionDetected = false;
    this.scheduleHighlightActivation();
  }

  private createClickableHighlights(): void {
    console.debug('Creating highlight system for clickable objects');

    this.clickableObjects.forEach(obj => {
      if (!obj) {
        console.warn('Clickable object is null, skipping highlight creation');
        return;
      }

      obj.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          this.originalMaterials.set(child, child.material);
        }
      });

      const highlightColor = 0xff6666;
      const highlightLight = new THREE.PointLight(highlightColor, 0, 15);

      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      highlightLight.position.set(
        center.x,
        center.y + size.y * 0.3,
        center.z + size.z * 0.3
      );

      this.scene.add(highlightLight);
      this.highlightLights.set(obj, highlightLight);

      console.debug(`Created highlight light for ${obj.name} at position:`, highlightLight.position);
    });
  }



  private createEmissiveMaterial(originalMaterial: THREE.Material | THREE.Material[], emissiveColor: number): THREE.Material | THREE.Material[] {
    if (Array.isArray(originalMaterial)) {
      return originalMaterial.map(mat => this.createSingleEmissiveMaterial(mat, emissiveColor));
    } else {
      return this.createSingleEmissiveMaterial(originalMaterial, emissiveColor);
    }
  }

  private createSingleEmissiveMaterial(originalMaterial: THREE.Material, emissiveColor: number): THREE.Material {
    const newMaterial = originalMaterial.clone();

    if (newMaterial instanceof THREE.MeshStandardMaterial ||
        newMaterial instanceof THREE.MeshLambertMaterial ||
        newMaterial instanceof THREE.MeshPhongMaterial) {

      newMaterial.emissive = new THREE.Color(emissiveColor);
      newMaterial.emissiveIntensity = 0;
    }

    return newMaterial;
  }

  private activateHighlights(): void {
    if (this.userInteractionDetected) {
      console.debug('User interaction detected, skipping highlight activation');
      return;
    }

    console.debug('Activating emissive and light highlights for clickable objects');

    if (!this.highlightsHaveBeenShown) {
      this.highlightsHaveBeenShown = true;
      console.debug('Highlights shown for first time');
    }

    this.highlightTimeline = gsap.timeline({
      repeat: -1,
      yoyo: true
    });

    this.clickableObjects.forEach((obj, index) => {
      const highlightLight = this.highlightLights.get(obj);
      const highlightColor = 0xff6666;

      if (highlightLight) {
        console.debug(`Setting up pulsing highlight for ${obj.name}`);

        this.highlightTimeline!
          .to(highlightLight, {
            intensity: 2.0,
            duration: this.HIGHLIGHT_PULSE_DURATION,
            ease: "power2.inOut"
          }, 0);

        obj.traverse((child) => {
          if (child instanceof THREE.Mesh && this.originalMaterials.has(child)) {
            const originalMaterial = this.originalMaterials.get(child)!;
            const emissiveMaterial = this.createEmissiveMaterial(originalMaterial, highlightColor);
            child.material = emissiveMaterial;

            if (Array.isArray(emissiveMaterial)) {
              emissiveMaterial.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial ||
                    mat instanceof THREE.MeshLambertMaterial ||
                    mat instanceof THREE.MeshPhongMaterial) {
                  this.highlightTimeline!
                    .to(mat, {
                      emissiveIntensity: 0.3,
                      duration: this.HIGHLIGHT_PULSE_DURATION,
                      ease: "power2.inOut"
                    }, 0);
                }
              });
            } else if (emissiveMaterial instanceof THREE.MeshStandardMaterial ||
                       emissiveMaterial instanceof THREE.MeshLambertMaterial ||
                       emissiveMaterial instanceof THREE.MeshPhongMaterial) {
              this.highlightTimeline!
                .to(emissiveMaterial, {
                  emissiveIntensity: 0.3,
                  duration: this.HIGHLIGHT_PULSE_DURATION,
                  ease: "power2.inOut"
                }, 0);
            }
          }
        });
      }
    });
  }

  private disableHighlights(): void {
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = undefined;
    }

    if (this.highlightTimeline) {
      this.highlightTimeline.kill();
    }

    console.debug('Disabling emissive and light highlights');

    this.clickableObjects.forEach(obj => {
      const highlightLight = this.highlightLights.get(obj);
      if (highlightLight) {
        gsap.to(highlightLight, {
          intensity: 0,
          duration: 0.5,
          ease: "power2.out"
        });
      }

      obj.traverse((child) => {
        if (child instanceof THREE.Mesh && this.originalMaterials.has(child)) {
          child.material = this.originalMaterials.get(child)!;
        }
      });
    });
  }

  private cleanupHighlights(): void {
    this.highlightLights.forEach((light) => {
      this.scene.remove(light);
      light.dispose();
    });
    this.highlightLights.clear();

    this.clickableObjects.forEach(obj => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh && this.originalMaterials.has(child)) {
          child.material = this.originalMaterials.get(child)!;
        }
      });
    });
    this.originalMaterials.clear();
  }

  /**
   * Public method to trigger highlight clickable objects from external components
   */
  public triggerHighlightClickableObjects(): void {
    console.debug('triggerHighlightClickableObjects called from external component');

    // Reset any existing user interaction state to allow highlights
    this.userInteractionDetected = false;

    // Clear any existing highlight timeout
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = undefined;
    }

    // Clear any existing highlight disable debounce timeout
    if (this.highlightDisableDebounceTimeout) {
      clearTimeout(this.highlightDisableDebounceTimeout);
      this.highlightDisableDebounceTimeout = undefined;
    }

    // Ensure user interaction listeners are set up to detect when to disable highlights
    this.setupUserInteractionListeners();

    // Activate highlights immediately
    this.activateHighlights();
  }

  /**
   * Public method to disable highlight clickable objects from external components
   */
  public disableHighlightClickableObjects(): void {
    console.debug('disableHighlightClickableObjects called from external component');

    // Set user interaction detected to prevent re-activation
    this.userInteractionDetected = true;

    // Disable highlights immediately
    this.disableHighlights();
  }

}
