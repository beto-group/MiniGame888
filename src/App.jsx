function App({ 
  folderPath,
  ALL_CARD_DEFINITIONS,
  finalMessageOptions,
  LoadingLogo,
  LoadingConfirmation,
  FreshPip,
  WelcomeMessageComponent,
  BasicView,
  ExitButtonComponent,
  CategorizedPipsListComponent,
  EnigmaView,
  StatusPipContentComponent
}) {
  const localDc = typeof dc !== 'undefined' ? dc : window.dc;
  const { useRef, useEffect, useState, useCallback } = localDc;
  const { h: preactH } = localDc.preact;

  const ENIGMA_PIP_PERSISTENT_KEY = 'persistent-enigma-pip-key';
  const DEFAULT_FALLBACK_ZINDEX = 10000;
  const PIP_MINIMIZED_SIZE_NUM = 80;

  function WorldView() {
    // Loading confirmation states
    const [showLoadingConfirm, setShowLoadingConfirm] = useState(false);
    const [isDownloadingAssets, setIsDownloadingAssets] = useState(false);
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [assetsChecked, setAssetsChecked] = useState(false);
    
    // Helper function to build relative GLB paths with remote fallback and caching
    const getGLBPath = useCallback(async (filename) => {
      const cacheDir = `${folderPath}/data/cache`;
      const vaultRelativePath = `${cacheDir}/${filename}`;
      
      const adapter = localDc.app.vault.adapter;
      const localExists = await adapter.exists(vaultRelativePath);
      
      if (localExists) {
        return adapter.getResourcePath(vaultRelativePath);
      } else {
        const remoteUrl = `https://raw.githubusercontent.com/beto-group/beto.assets/main/DATACORE/MINIGAME/${filename}`;
        console.log(`[MiniGame] Downloading ${filename} from remote...`);
        
        try {
          const response = await fetch(remoteUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          
          if (!(await adapter.exists(cacheDir))) {
            console.log(`[MiniGame] Creating cache directory: ${cacheDir}`);
            await adapter.mkdir(cacheDir);
          }
          
          const uint8Array = new Uint8Array(arrayBuffer);
          await adapter.writeBinary(vaultRelativePath, uint8Array);
          console.log(`[MiniGame] File cached successfully: ${vaultRelativePath}`);
          
          return adapter.getResourcePath(vaultRelativePath);
        } catch (downloadError) {
          console.warn(`[MiniGame] Failed to cache file. Falling back to direct URL.`, downloadError);
          return remoteUrl;
        }
      }
    }, [folderPath]);
    
    const canvasRef = useRef(null);
    const cameraRef = useRef(null);
    const [engine, setEngine] = useState(null);
    const [scene, setScene] = useState(null);
    const babylonContainerRef = useRef(null);
    const originalBabylonParentRef = useRef(null);
    const [isGameModeActive, setIsGameModeActive] = useState(false);
    const [showWelcomePip, setShowWelcomePip] = useState(false);
    const [hasCardBeenClicked, setHasCardBeenClicked] = useState(false);
    const [categorizationStatus, setCategorizationStatus] = useState('idle');
    const [showMusicPip, setShowMusicPip] = useState(false);
    const [showExitPip, setShowExitPip] = useState(false);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [totalTries, setTotalTries] = useState(0);
    const [isPlayButtonHovered, setIsPlayButtonHovered] = useState(false);

    const [activeEnigma, setActiveEnigma] = useState(null);
    const activeEnigmaRef = useRef(null);

    useEffect(() => {
      activeEnigmaRef.current = activeEnigma;
    }, [activeEnigma]);

    const [hoveredStatusPipId, _setHoveredStatusPipId] = useState(null);
    const [draggedEnigmaDetails, _setDraggedEnigmaDetails] = useState(null);
    const [categorizedPips, setCategorizedPips] = useState({});

    const draggedEnigmaDetailsRef = useRef(draggedEnigmaDetails);
    const hoveredStatusPipIdRef = useRef(hoveredStatusPipId);
    const categorizedPipsRef = useRef(categorizedPips);
    const totalTriesRef = useRef(totalTries);

    useEffect(() => { draggedEnigmaDetailsRef.current = draggedEnigmaDetails; }, [draggedEnigmaDetails]);
    useEffect(() => { hoveredStatusPipIdRef.current = hoveredStatusPipId; }, [hoveredStatusPipId]);
    useEffect(() => { categorizedPipsRef.current = categorizedPips; }, [categorizedPips]);
    useEffect(() => { totalTriesRef.current = totalTries; }, [totalTries]);

    const setHoveredStatusPipId = useCallback((id) => {
      hoveredStatusPipIdRef.current = id;
      _setHoveredStatusPipId(id);
    }, []);

    const setDraggedEnigmaDetails = useCallback((details) => {
      draggedEnigmaDetailsRef.current = details;
      _setDraggedEnigmaDetails(details);
    }, []);

    const handleWelcomeMessageComplete = useCallback(() => {
      setShowWelcomePip(false);
    }, []);

    const closePersistentEnigma = useCallback((options = { restoreMeshVisibility: true }) => {
      const enigmaBeingClosed = activeEnigmaRef.current;
      if (options.restoreMeshVisibility && enigmaBeingClosed && enigmaBeingClosed.mesh) {
        let isAlreadyCategorized = false;
        const currentCategorized = categorizedPipsRef.current;
        if (enigmaBeingClosed.pipId) {
          for (const categoryId in currentCategorized) {
            if (currentCategorized[categoryId].some(item => item.pipId === enigmaBeingClosed.pipId)) {
              isAlreadyCategorized = true;
              break;
            }
          }
        }
        if (!isAlreadyCategorized) {
          enigmaBeingClosed.mesh.isVisible = true;
        }
      }
      setActiveEnigma(null);
    }, []);

    const exitGameMode = useCallback(() => {
      if (cameraRef.current && canvasRef.current) {
        try {
          cameraRef.current.detachControl();
        } catch (e) {
          // Ignore
        }
      }
      
      if (activeEnigmaRef.current) {
        closePersistentEnigma();
      }
      Object.values(categorizedPipsRef.current).flat().forEach(item => {
        if (scene && item.meshName) {
          const mesh = scene.getMeshByName(item.meshName);
          if (mesh) mesh.isVisible = true;
        }
      });
      setCategorizedPips({});
      setDraggedEnigmaDetails(null);
      setHoveredStatusPipId(null);
      setIsGameModeActive(false);
      setShowWelcomePip(false);
      setHasCardBeenClicked(false);
      setCategorizationStatus('idle');
      setShowMusicPip(false);
      setShowExitPip(false);
      setIsGameFinished(false);
      setTotalTries(0);
    }, [cameraRef, canvasRef, closePersistentEnigma, scene, setDraggedEnigmaDetails, setHoveredStatusPipId]);

    const handleEnigmaPipDragStateChange = useCallback((pipId, isDragging, componentProps) => {
      if (isDragging) {
        const mesh = activeEnigmaRef.current?.mesh || null;
        const propsOnDragStart = activeEnigmaRef.current?.componentProps || componentProps || {};
        const newDragDetails = { pipId, props: propsOnDragStart, mesh };
        setDraggedEnigmaDetails(newDragDetails);
        setCategorizationStatus('idle');
        return false;
      } else {
        setTotalTries(prev => prev + 1);
        const previouslyDragged = draggedEnigmaDetailsRef.current;
        const finalHoveredStatusPipId = hoveredStatusPipIdRef.current;

        setDraggedEnigmaDetails(null);
        setHoveredStatusPipId(null);

        if (finalHoveredStatusPipId && previouslyDragged && previouslyDragged.pipId === pipId) {
          const droppedCardDef = previouslyDragged.props?.cardDefinition;

          if (!droppedCardDef || !droppedCardDef.category) {
              setCategorizationStatus('fail');
              return false;
          }

          const normalizedCardCategory = droppedCardDef.category.trim().toUpperCase();
          const normalizedTargetCategory = finalHoveredStatusPipId.split('-')[0].trim().toUpperCase();

          if (normalizedCardCategory !== normalizedTargetCategory) {
              setCategorizationStatus('fail');
              return false;
          }

          setCategorizationStatus('success');
          let newCategorizedState;
          setCategorizedPips(prev => {
            const newCategoryItems = [
              ...(prev[finalHoveredStatusPipId] || []),
              {
                pipId: previouslyDragged.pipId,
                displayName: `${droppedCardDef.title} (${droppedCardDef.id.toUpperCase()})`,
                sourceModelFilename: droppedCardDef.glbFilename,
                meshName: previouslyDragged.mesh?.name,
                cardDefinition: droppedCardDef
              }
            ];
            newCategorizedState = { ...prev, [finalHoveredStatusPipId]: newCategoryItems };
            return newCategorizedState;
          });

          const totalCategorizedCount = Object.values(newCategorizedState).flat().length;
          if (totalCategorizedCount >= ALL_CARD_DEFINITIONS.length) {
              setIsGameFinished(true);
              setShowWelcomePip(true);
          }

          if (previouslyDragged.mesh) {
            previouslyDragged.mesh.isVisible = false;
          } else if (activeEnigmaRef.current && activeEnigmaRef.current.pipId === pipId && activeEnigmaRef.current.mesh) {
            activeEnigmaRef.current.mesh.isVisible = false;
          }

          closePersistentEnigma({ restoreMeshVisibility: false });
          return true;
        } else {
          if (previouslyDragged) {
              setCategorizationStatus('fail');
          }
          return false;
        }
      }
    }, [closePersistentEnigma, setDraggedEnigmaDetails, setHoveredStatusPipId, ALL_CARD_DEFINITIONS]);

    const enterGameMode = useCallback(() => {
      if (!babylonContainerRef.current || !canvasRef.current || !engine || !cameraRef.current) {
        return;
      }
      
      setTimeout(() => {
        if (engine && !engine.isDisposed) {
          engine.resize();
        }
        if (cameraRef.current && canvasRef.current) {
          cameraRef.current.attachControl(canvasRef.current, true);
        }
      }, 100);
      
      setIsGameModeActive(true);
      setShowWelcomePip(true);
      setHasCardBeenClicked(false);
      setCategorizationStatus('idle');
      setShowMusicPip(true);
      setShowExitPip(true);
      setIsGameFinished(false);
      setTotalTries(0);
    }, [engine, cameraRef, canvasRef, babylonContainerRef]);

    useEffect(() => {
      const styleId = 'spin-animations-style';
      if (isGameModeActive) {
        if (!document.getElementById(styleId)) {
          const styleSheet = document.createElement("style");
          styleSheet.id = styleId;
          styleSheet.innerText = `
            @keyframes spinTextAround { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes pipShake {
              0%, 100% { transform: translateX(0); }
              20%, 60% { transform: translateX(-5px); }
              40%, 80% { transform: translateX(5px); }
            }
            .pip-shaking {
              animation: pipShake 0.3s ease-in-out;
              animation-fill-mode: forwards;
            }
            @keyframes spinIcon { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes spinCompositor {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(styleSheet);
        }
      }
      return () => {
        const styleTag = document.getElementById(styleId);
        if (styleTag) styleTag.remove();
      };
    }, [isGameModeActive]);

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(document.querySelector(`script[src="${src}"]`)); return;
        }
        const script = document.createElement("script");
        script.src = src; script.async = true;
        script.onload = () => resolve(script);
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
      });
    };

    const initBabylon = async () => {
      if (!canvasRef.current || !window.BABYLON || !window.BABYLON.SceneLoader || engine) {
        return () => { };
      }
      const babylonEngine = new window.BABYLON.Engine(canvasRef.current, true, { 
        preserveDrawingBuffer: true, 
        stencil: true, 
        antialias: true 
      });
      const babylonScene = new window.BABYLON.Scene(babylonEngine);
      babylonScene.clearColor = new window.BABYLON.Color4(0, 0, 0, 0);

      const stackBasePosition = new window.BABYLON.Vector3(0, 0, 0);
      const cameraTarget = stackBasePosition;
      const camera = new window.BABYLON.ArcRotateCamera("Camera", Math.PI, Math.PI / 3, 7, cameraTarget, babylonScene);
      cameraRef.current = camera;
      camera.minZ = 0.01; camera.lowerBetaLimit = 0.1; camera.upperBetaLimit = (Math.PI / 2) - 0.01;
      camera.wheelPrecision = 50; camera.lowerRadiusLimit = 1; camera.upperRadiusLimit = 11;
      new window.BABYLON.HemisphericLight("light1", new window.BABYLON.Vector3(1, 1, 0), babylonScene);
      new window.BABYLON.HemisphericLight("light2", new window.BABYLON.Vector3(-1, 1, -0.5), babylonScene);
      
      const blankCardPath = await getGLBPath("b26.card.blank.glb");
      try {
        if (!blankCardPath) throw new Error("Unable to resolve blank card path");
        
        const urlParts = blankCardPath.split('?');
        const cleanUrl = urlParts[0];
        const lastSlashIndex = cleanUrl.lastIndexOf('/');
        const rootUrl = cleanUrl.substring(0, lastSlashIndex + 1);
        const filename = cleanUrl.substring(lastSlashIndex + 1) + (urlParts[1] ? '?' + urlParts[1] : '');
        
        const resB = await window.BABYLON.SceneLoader.ImportMeshAsync(null, rootUrl, filename, babylonScene);
        let blankMesh = resB.meshes.find(m => m.getTotalVertices() > 0 && m.name !== "__root__") || resB.meshes[0];
        if (blankMesh) {
          blankMesh.name = "CardBlank"; blankMesh.position = stackBasePosition.clone();
          blankMesh.scaling = new window.BABYLON.Vector3(2.5, 111, 2.5);
          blankMesh.rotationQuaternion = null; blankMesh.rotation.y = Math.PI / 2;
        }
      } catch (e) {
        // Ignore blank card loading errors
      }

      const interactiveCardMeshes = [];
      const SPREAD_AREA_WIDTH = 2.675, SPREAD_AREA_DEPTH = 2.8, CARD_Y_OFFSET = 0.05, CARD_RANDOM_HEIGHT_RANGE = 0.01, CARD_RANDOM_ROTATION_Y_RANGE = Math.PI / 12, CARD_SPACING_MARGIN = 0.05;

      const currentCardDefinitions = Array.isArray(ALL_CARD_DEFINITIONS) ? ALL_CARD_DEFINITIONS : [];

      if (currentCardDefinitions.length > 0) {
          const numCards = currentCardDefinitions.length;
          const cols = Math.min(5, Math.ceil(Math.sqrt(numCards)));
          const rows = Math.ceil(numCards / cols);
          const cellWidth = SPREAD_AREA_WIDTH / cols;
          const cellHeight = SPREAD_AREA_DEPTH / rows;
          const s_scale_factor = 2.5 / 10.0;
          const cardFootprintWidth = s_scale_factor;
          const cardFootprintDepth = s_scale_factor;

          let cardIndex = 0;
          for (const cardDef of currentCardDefinitions) {
              if (!cardDef.glbFilename || !cardDef.id) {
                  continue;
              }
              const cardModelPath = await getGLBPath(cardDef.glbFilename);

              try {
                  if (!cardModelPath) throw new Error(`Unable to resolve path for ${cardDef.glbFilename}`);
                  
                  const urlParts = cardModelPath.split('?');
                  const cleanUrl = urlParts[0];
                  const lastSlashIndex = cleanUrl.lastIndexOf('/');
                  const rootUrl = cleanUrl.substring(0, lastSlashIndex + 1);
                  const filename = cleanUrl.substring(lastSlashIndex + 1) + (urlParts[1] ? '?' + urlParts[1] : '');
                  
                  const resCard = await window.BABYLON.SceneLoader.ImportMeshAsync(null, rootUrl, filename, babylonScene);
                  let cardMesh = resCard.meshes.find(m => m.getTotalVertices() > 0 && m.name !== "__root__") || resCard.meshes[0];
                  if (cardMesh) {
                      cardMesh.name = `Card-${cardDef.id}`;
                      const r_grid = Math.floor(cardIndex / cols);
                      const c_grid = cardIndex % cols;
                      const cellCenterX = stackBasePosition.x - SPREAD_AREA_WIDTH / 2 + cellWidth * (c_grid + 0.5);
                      const cellCenterZ = stackBasePosition.z - SPREAD_AREA_DEPTH / 2 + cellHeight * (r_grid + 0.5);
                      const jitterRangeX = Math.max(0, (cellWidth - cardFootprintWidth - CARD_SPACING_MARGIN) / 2 * 0.8);
                      const jitterRangeZ = Math.max(0, (cellHeight - cardFootprintDepth - CARD_SPACING_MARGIN) / 2 * 0.8);

                      cardMesh.position.x = cellCenterX + (Math.random() - 0.5) * 2 * jitterRangeX;
                      cardMesh.position.z = cellCenterZ + (Math.random() - 0.5) * 2 * jitterRangeZ;
                      cardMesh.position.y = stackBasePosition.y + CARD_Y_OFFSET + (Math.random() - 0.5) * CARD_RANDOM_HEIGHT_RANGE;

                      cardMesh.scaling = new window.BABYLON.Vector3(s_scale_factor, s_scale_factor * 33, s_scale_factor);

                      cardMesh.rotationQuaternion = null;
                      cardMesh.rotation.y = (Math.PI / 2) + (Math.random() - 0.5) * CARD_RANDOM_ROTATION_Y_RANGE;
                      cardMesh.rotation.z = Math.PI;

                      cardMesh.userData = { cardDefinition: cardDef };
                      interactiveCardMeshes.push(cardMesh);
                      cardIndex++;
                  }
              } catch (e) {
                  // Ignore card load error
              }
          }
      }

      let cardPointerObserver = null;
      if (interactiveCardMeshes.length > 0) {
        cardPointerObserver = babylonScene.onPointerObservable.add((pointerInfo) => {
          if (pointerInfo.type === window.BABYLON.PointerEventTypes.POINTERPICK && pointerInfo.pickInfo?.hit && interactiveCardMeshes.includes(pointerInfo.pickInfo.pickedMesh)) {
            const clickedMesh = pointerInfo.pickInfo.pickedMesh;
            const cardDef = clickedMesh.userData?.cardDefinition;

            if (!cardDef) return;

            const pipIdForCard = `enigma-viewer-${cardDef.id}`;
            if (!EnigmaView) return;

            let isCategorized = false;
            const currentCategorized = categorizedPipsRef.current;
            for (const categoryId in currentCategorized) {
              if (currentCategorized[categoryId].some(item => item.pipId === pipIdForCard)) {
                isCategorized = true;
                break;
              }
            }
            if (isCategorized) return;

            const currentActive = activeEnigmaRef.current;
            if (currentActive?.pipId === pipIdForCard) {
              return;
            }

            if (currentActive && currentActive.pipId !== pipIdForCard) {
              if (currentActive.mesh) {
                  let prevIsCategorized = false;
                  if(currentActive.pipId){
                      for (const categoryId in currentCategorized) {
                          if (currentCategorized[categoryId].some(item => item.pipId === currentActive.pipId)) {
                              prevIsCategorized = true;
                              break;
                          }
                      }
                  }
                  if(!prevIsCategorized) currentActive.mesh.isVisible = true;
              }
            }

            const enigmaViewProps = {
              sourceMesh: clickedMesh,
              titleText: `${cardDef.title}`,
              descriptionText: cardDef.description,
              cardDefinition: cardDef
            };

            clickedMesh.isVisible = false;
            setActiveEnigma({
              pipId: pipIdForCard,
              mesh: clickedMesh,
              componentProps: enigmaViewProps
            });

            setHasCardBeenClicked(true);
          }
        });
      }
      setEngine(babylonEngine); setScene(babylonScene);
      babylonEngine.runRenderLoop(() => { if (babylonScene?.activeCamera && !babylonEngine.isDisposed) babylonScene.render(); });
      const resizeHandler = () => { if (babylonEngine && !babylonEngine.isDisposed) babylonEngine.resize(); };
      window.addEventListener("resize", resizeHandler);

      return () => {
        window.removeEventListener("resize", resizeHandler);
        if (babylonScene && cardPointerObserver) babylonScene.onPointerObservable.remove(cardPointerObserver);
        
        if (cameraRef.current) {
          try {
            cameraRef.current.detachControl();
          } catch (e) {
            // Ignore
          }
        }
        
        const lastActive = activeEnigmaRef.current;
        if (lastActive && lastActive.mesh) {
          let isStillCategorized = false;
          const currentCategorizedOnCleanup = categorizedPipsRef.current;
          if (lastActive.pipId) {
              for (const categoryId in currentCategorizedOnCleanup) {
                  if (currentCategorizedOnCleanup[categoryId].some(item => item.pipId === lastActive.pipId)) {
                      isStillCategorized = true;
                      break;
                  }
              }
          }
          if (!isStillCategorized) {
            lastActive.mesh.isVisible = true;
          }
        }
        babylonEngine?.stopRenderLoop(); babylonScene?.dispose(); babylonEngine?.dispose();
        setEngine(null); setScene(null); cameraRef.current = null;
      };
    };

    useEffect(() => {
      if (showLoadingConfirm || !assetsLoaded) {
        return;
      }
      
      let babylonCleanupFunction = () => { };
      let isMounted = true;
      const setupEnvironment = async () => {
        if (engine || !canvasRef.current) return;
        try {
          if (!window.BABYLON?.SceneLoader) {
            await loadScript("https://cdn.babylonjs.com/babylon.js");
            await loadScript("https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js");
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          if (isMounted && canvasRef.current && !engine) {
            const cleanupFn = await initBabylon();
            if (isMounted) babylonCleanupFunction = cleanupFn; else cleanupFn?.();
          }
        } catch (error) {
          // Ignore
        }
      };
      if (babylonContainerRef.current && canvasRef.current && !engine) setupEnvironment();
      return () => {
        isMounted = false;
        babylonCleanupFunction?.();
      };
    }, [babylonContainerRef, canvasRef, assetsLoaded, showLoadingConfirm]);

    useEffect(() => {
      if (assetsChecked) return;

      const checkLocalAssets = async () => {
        try {
          const blankCardPath = `${folderPath}/data/cache/b26.card.blank.glb`;
          const adapter = localDc.app.vault.adapter;
          const localExists = await adapter.exists(blankCardPath);
          
          if (localExists) {
            console.log('[MiniGame] Local assets found, loading directly...');
            setAssetsLoaded(true);
          } else {
            console.log('[MiniGame] No local assets found, showing confirmation...');
            setShowLoadingConfirm(true);
          }
          setAssetsChecked(true);
        } catch (error) {
          console.error('[MiniGame] Error checking local assets:', error);
          setShowLoadingConfirm(true);
          setAssetsChecked(true);
        }
      };

      checkLocalAssets();
    }, [assetsChecked]);

    const handleLoadAssets = async () => {
      setShowLoadingConfirm(false);
      setIsDownloadingAssets(true);
      
      try {
        console.log('[MiniGame] Pre-downloading all card assets...');
        const cardDefinitions = Array.isArray(ALL_CARD_DEFINITIONS) ? ALL_CARD_DEFINITIONS : [];
        const filesToDownload = ['b26.card.blank.glb', ...cardDefinitions.map(c => c.glbFilename).filter(Boolean)];
        
        for (const filename of filesToDownload) {
          await getGLBPath(filename);
        }
        
        console.log('[MiniGame] All assets loaded successfully');
        setAssetsLoaded(true);
      } catch (error) {
        console.error('[MiniGame] Error loading assets:', error);
        setAssetsLoaded(true);
      } finally {
        setIsDownloadingAssets(false);
      }
    };

    useEffect(() => {
      const handleKeyDown = (event) => { if (event.key === "Escape" && isGameModeActive) exitGameMode(); };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isGameModeActive, exitGameMode]);

    const mainWrapperStyle = {
      width: '100%',
      height: '100%',
      position: 'relative',
      background: 'radial-gradient(ellipse at center, var(--background-primary) 0%, var(--background-secondary) 100%)',
      fontFamily: `'Consolas', 'Monaco', 'Lucida Console', 'monospace'`,
      color: 'var(--text-normal)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    const preGameOverlayStyle = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    };
    
    const playButtonStyleBase = {
      padding: '20px 48px',
      fontSize: '18px',
      fontWeight: '600',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      cursor: 'pointer',
      color: '#ffffff',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      borderRadius: '12px',
      background: 'rgba(139, 92, 246, 0.15)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 0 20px rgba(139, 92, 246, 0.2), 0 4px 6px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.2s ease',
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    };

    const playButtonStyleHover = {
      background: 'rgba(139, 92, 246, 0.25)',
      borderColor: 'rgba(139, 92, 246, 0.5)',
      boxShadow: '0 0 30px rgba(139, 92, 246, 0.3), 0 6px 12px rgba(0, 0, 0, 0.4)',
      transform: 'translateY(-2px)'
    };

    const finalPlayButtonStyle = isPlayButtonHovered
      ? { ...playButtonStyleBase, ...playButtonStyleHover }
      : playButtonStyleBase;

    const isLoadingAssets = !engine || !cameraRef.current || !EnigmaView || !ALL_CARD_DEFINITIONS || !Array.isArray(ALL_CARD_DEFINITIONS) || ALL_CARD_DEFINITIONS.length === 0 || !LoadingLogo;

    const DEFAULT_BABYLON_CONTAINER_STYLE = 'width:100%;height:100%;position:relative;overflow:hidden;background:transparent;';
    const WINDOW_MODE_STYLE = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;background-color:var(--background-primary);';

    const LoadingIcon = ({ size = "20px", color = "white" }) => preactH('svg', {
        width: size, height: size, viewBox: "0 0 50 50", style: { animation: 'spinIcon 1s linear infinite', display: 'block' }
      }, preactH('circle', {
        cx:"25", cy:"25", r:"20", fill:"none", stroke:color, strokeWidth:"5", strokeDasharray:"31.415, 31.415", strokeDashoffset:"0"
      }, preactH('animateTransform', {
        attributeName: "transform", type: "rotate", from: "0 25 25", to: "360 25 25", dur: "1s", repeatCount: "indefinite"
      }))
    );

    const statusPipsConfig = [
        { id: 'systems-pip', text: 'SYSTEMS', originalBorderColor: '#ff7675', hoverBorderColor: '#FF4136', subtleHoverBorderColor: '#ff9a94', originalBackgroundColor: '#282828', hoverBackgroundColor: '#ffbaba', subtleHoverBgColor: '#332e2e', originalTextColor: '#f5f6fa'},
        { id: 'perception-pip', text: 'PERCEPTION', originalBorderColor: '#55efc4', hoverBorderColor: '#2ECC71', subtleHoverBorderColor: '#7cf2d3', originalBackgroundColor: '#282828', hoverBackgroundColor: '#a6e9c0', subtleHoverBgColor: '#2e3331', originalTextColor: '#f5f6fa'},
        { id: 'strategy-pip', text: 'STRATEGY', originalBorderColor: '#74b9ff', hoverBorderColor: '#007bff', subtleHoverBorderColor: '#9acbff', originalBackgroundColor: '#282828', hoverBackgroundColor: '#b3d9ff', subtleHoverBgColor: '#2e3133', originalTextColor: '#f5f6fa'}
    ];

    return preactH('div', { className: 'world-view-main-wrapper', style: mainWrapperStyle },
      showLoadingConfirm && preactH(LoadingConfirmation, {
        dc: localDc,
        onConfirm: handleLoadAssets,
        onCancel: () => setShowLoadingConfirm(false)
      }),
      
      isDownloadingAssets && !showLoadingConfirm && preactH('div', {
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--background-primary)',
          zIndex: 10000
        }
      },
        preactH('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            background: 'var(--background-secondary)',
            padding: '48px 64px',
            borderRadius: '16px',
            border: '1px solid var(--background-modifier-border)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            textAlign: 'center'
          }
        },
          preactH('div', {
            style: {
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--background-primary)',
              border: '2px solid rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.15)'
            }
          },
            preactH(LoadingIcon, { size: '40px', color: '#8b5cf6' })
          ),
          preactH('div', {
            style: {
              fontSize: '24px',
              fontWeight: '700',
              letterSpacing: '-0.5px',
              color: 'var(--text-normal)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }
          }, 'Loading Card Assets'),
          preactH('div', {
            style: {
              fontSize: '13px',
              color: 'var(--text-muted)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }
          }, 'Downloading and caching game files...')
        )
      ),
      
      preactH('div', { ref: originalBabylonParentRef, className: 'original-babylon-parent-placeholder', style: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 } },
        preactH('div', { 
          ref: babylonContainerRef, 
          className: 'babylon-canvas-dynamic-container', 
          style: isGameModeActive ? WINDOW_MODE_STYLE : DEFAULT_BABYLON_CONTAINER_STYLE
        },
          preactH('canvas', { 
            ref: canvasRef, 
            tabIndex: isGameModeActive ? 0 : -1, 
            style: { 
              width: "100%", 
              height: "100%", 
              display: 'block', 
              outline: "none", 
              pointerEvents: 'auto'
            }, 
            touchAction: "none" 
          })
        )
      ),
      !isGameModeActive && preactH('div', { style: preGameOverlayStyle },
        isLoadingAssets
          ? preactH(LoadingLogo, { dc: localDc })
          : preactH('button', {
              onClick: enterGameMode,
              style: finalPlayButtonStyle,
              onMouseEnter: () => setIsPlayButtonHovered(true),
              onMouseLeave: () => setIsPlayButtonHovered(false),
            }, 
            preactH('svg', {
              width: '20px', height: '20px', viewBox: '0 0 24 24', fill: 'none',
              stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
              style: { display: 'block' }
            },
              preactH('polygon', { points: '5 3 19 12 5 21 5 3' })
            ),
            'Play Game'
          )
      ),

      // GPU-Accelerated Compositor Spinner Overlay
      isGameModeActive && !engine && preactH('div', {
        style: {
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--background-primary)',
          zIndex: DEFAULT_FALLBACK_ZINDEX + 500
        }
      },
        preactH('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }
        },
          preactH('div', {
            style: {
              width: '50px',
              height: '50px',
              border: '3px solid rgba(139, 92, 246, 0.15)',
              borderTop: '3px solid #8b5cf6',
              borderRadius: '50%',
              animation: 'spinCompositor 1s linear infinite',
              willChange: 'transform',
              transform: 'translateZ(0)',
            }
          }),
          preactH('div', {
            style: {
              color: 'var(--text-normal)',
              fontSize: '16px',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: '500',
              letterSpacing: '0.5px'
            }
          }, 'Initializing 3D Environment...')
        )
      ),

      // Floating component overlays (rendered inline inside wrapper)
      isGameModeActive && engine && activeEnigma && preactH(FreshPip, {
        dc: localDc,
        key: ENIGMA_PIP_PERSISTENT_KEY,
        pipId: activeEnigma.pipId,
        onClose: closePersistentEnigma,
        component: EnigmaView,
        componentProps: {
          dc: localDc,
          loadScript: async (dcCtx, src) => {
            return new Promise((res, rej) => {
              if (document.querySelector(`script[src="${src}"]`)) {
                res(); return;
              }
              const script = document.createElement("script");
              script.src = src; script.async = true;
              script.onload = () => res(script);
              script.onerror = () => rej(new Error(`Failed to load script: ${src}`));
              document.body.appendChild(script);
            });
          },
          ...(activeEnigma.componentProps || {})
        },
        onDragStateChange: handleEnigmaPipDragStateChange,
        isVisible: true,
        startMinimized: false,
        lockMinimizedState: false,
        initialStyle: {
          width: "300px",
          height: "400px",
          top: "20px",
          left: "20px",
          borderRadius: "8px",
          backgroundColor: "var(--background-secondary)",
          border: "2px solid var(--background-modifier-border)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
          zIndex: DEFAULT_FALLBACK_ZINDEX + 100
        },
        titleText: "ENIGMA"
      }),

      isGameModeActive && engine && (showWelcomePip || isGameFinished) && preactH(FreshPip, {
        dc: localDc,
        key: "welcome-message-pip",
        pipId: "welcome-message-pip",
        component: WelcomeMessageComponent,
        componentProps: {
          message: "Bonjour 🫡 . Welcome to our first experi{m}en{T}ce.",
          hasCardBeenClicked: hasCardBeenClicked,
          categorizationStatus: categorizationStatus,
          onMessageSequenceComplete: handleWelcomeMessageComplete,
          isGameFinished: isGameFinished,
          totalTries: totalTries,
          finalMessageOptions: finalMessageOptions,
          onClaimAndExit: exitGameMode
        },
        initialStyle: {
          width: isGameFinished ? "480px" : "320px",
          height: isGameFinished ? "240px" : "100px",
          top: isGameFinished ? `calc(50% - 120px)` : "20px",
          left: isGameFinished ? `calc(50% - 240px)` : `calc(50% - 160px)`,
          right: "auto",
          borderRadius: "12px",
          backgroundColor: "var(--background-secondary)",
          border: "2px solid var(--background-modifier-border)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
          zIndex: DEFAULT_FALLBACK_ZINDEX + 200
        },
        onClose: null,
        titleText: isGameFinished ? "Final Report" : "Welcome!",
        startMinimized: false,
        lockMinimizedState: false,
        showContentWhenMinimized: false,
        hideHeaderElements: true,
        isDraggable: false,
        isVisible: true
      }),

      isGameModeActive && engine && showMusicPip && preactH(FreshPip, {
        dc: localDc,
        key: "music-player-pip",
        pipId: "music-player-pip",
        component: BasicView,
        componentProps: { folderPath, initialIsPlaying: true },
        initialStyle: {
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          top: "20px",
          right: "70px",
          left: "auto",
          backgroundColor: "var(--interactive-normal)",
          border: "2px solid var(--background-modifier-border)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          zIndex: DEFAULT_FALLBACK_ZINDEX + 180
        },
        onClose: null,
        titleText: "",
        startMinimized: false,
        lockMinimizedState: false,
        showContentWhenMinimized: true,
        hideHeaderElements: true,
        isDraggable: false,
        isVisible: true
      }),

      isGameModeActive && engine && showExitPip && preactH(FreshPip, {
        dc: localDc,
        key: "exit-game-pip",
        pipId: "exit-game-pip",
        component: ExitButtonComponent,
        componentProps: { onExit: exitGameMode },
        initialStyle: {
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          top: "20px",
          right: "20px",
          left: "auto",
          backgroundColor: "var(--interactive-normal)",
          border: "2px solid var(--background-modifier-border)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          zIndex: DEFAULT_FALLBACK_ZINDEX + 180
        },
        onClose: null,
        titleText: "",
        startMinimized: false,
        lockMinimizedState: false,
        showContentWhenMinimized: true,
        hideHeaderElements: true,
        isDraggable: false,
        isVisible: true
      }),

      isGameModeActive && engine && preactH(FreshPip, {
        dc: localDc,
        key: "categorized-list-pip",
        pipId: "categorized-list-pip",
        component: CategorizedPipsListComponent,
        componentProps: {
          categorizedItems: categorizedPips
        },
        initialStyle: {
          width: "220px",
          height: "260px",
          top: "auto",
          left: "auto",
          bottom: "20px",
          right: "20px",
          borderRadius: "8px",
          backgroundColor: "var(--background-secondary)",
          border: "2px solid var(--background-modifier-border)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
          zIndex: DEFAULT_FALLBACK_ZINDEX + 190
        },
        onClose: null,
        titleText: "Categorized Cards",
        startMinimized: false,
        lockMinimizedState: false,
        showContentWhenMinimized: false,
        hideHeaderElements: false,
        isDraggable: false,
        isVisible: true
      }),

      // Status Pips
      isGameModeActive && engine && statusPipsConfig.map((pipConfig, index) => {
        const isCursorDirectlyOverThis = pipConfig.id === hoveredStatusPipId;
        const isEnigmaPipCurrentlyDragging = !!draggedEnigmaDetails;

        const isHoveredByEnigmaDrag = isEnigmaPipCurrentlyDragging && isCursorDirectlyOverThis;
        const isHoveredByCursorOnly = isCursorDirectlyOverThis && !isEnigmaPipCurrentlyDragging;

        const PIP_DIAMETER_STATUS = 56;
        const PIP_SPACING_STATUS = 16;
        const DRAG_HOVER_SCALE_FACTOR = 1.15;
        const DRAG_HOVER_ADDITIONAL_SPACING = 10;
        const BASE_STATUS_PIP_ZINDEX = DEFAULT_FALLBACK_ZINDEX + 50;
        const HOVERED_STATUS_PIP_ZINDEX = BASE_STATUS_PIP_ZINDEX + 10;
        const TOP_MARGIN_FOR_STATUS_PIPS = 140;

        let currentPipTopOffsetValue = index * (PIP_DIAMETER_STATUS + PIP_SPACING_STATUS);
        let scale = 1;
        let zIndex = BASE_STATUS_PIP_ZINDEX;
        let currentBorderColor = pipConfig.originalBorderColor;
        let currentBackgroundColor = pipConfig.originalBackgroundColor;
        let textHoverColor = pipConfig.hoverBorderColor;

        const actualDragTargetIndex = isEnigmaPipCurrentlyDragging && hoveredStatusPipId
                                      ? statusPipsConfig.findIndex(p => p.id === hoveredStatusPipId)
                                      : -1;

        if (isHoveredByEnigmaDrag) {
            scale = DRAG_HOVER_SCALE_FACTOR;
            zIndex = HOVERED_STATUS_PIP_ZINDEX;
            currentBorderColor = pipConfig.hoverBorderColor;
            currentBackgroundColor = pipConfig.hoverBackgroundColor;
        } else if (isEnigmaPipCurrentlyDragging && actualDragTargetIndex !== -1 && index !== actualDragTargetIndex) {
            const scaledPipExtraSize = PIP_DIAMETER_STATUS * (DRAG_HOVER_SCALE_FACTOR - 1);
            const displacementDueToScale = scaledPipExtraSize / 2;
            if (index < actualDragTargetIndex) {
                currentPipTopOffsetValue -= (displacementDueToScale + DRAG_HOVER_ADDITIONAL_SPACING);
            } else {
                currentPipTopOffsetValue += (displacementDueToScale + DRAG_HOVER_ADDITIONAL_SPACING);
            }
        } else if (isHoveredByCursorOnly) {
            currentBorderColor = pipConfig.subtleHoverBorderColor;
            currentBackgroundColor = pipConfig.subtleHoverBgColor;
            zIndex = BASE_STATUS_PIP_ZINDEX + 1;
        }
        const topPosition = `${TOP_MARGIN_FOR_STATUS_PIPS + currentPipTopOffsetValue}px`;

        const pipInitialStyleForStatusPip = {
            top: topPosition, right: "35px", left: 'auto',
            width: `${PIP_DIAMETER_STATUS}px`, height: `${PIP_DIAMETER_STATUS}px`,
            borderRadius: '50%', backgroundColor: currentBackgroundColor,
            border: `2px solid ${currentBorderColor}`, transform: `scale(${scale})`, zIndex: zIndex,
            transition: `transform 0.2s ease-out, top 0.2s ease-out, border-color 0.2s ease-out, background-color 0.2s ease-out, box-shadow 0.2s ease-out`
        };

        return preactH(FreshPip, {
          dc: localDc,
          key: `status-pip-host-${pipConfig.id}`,
          pipId: `status-pip-host-${pipConfig.id}`,
          component: StatusPipContentComponent,
          componentProps: {
              text: pipConfig.text, textColor: pipConfig.originalTextColor,
              hoverTextColor: textHoverColor, pipDiameter: PIP_DIAMETER_STATUS,
              isHoveredByDrag: isHoveredByEnigmaDrag, isHoveredByCursorOnly: isHoveredByCursorOnly,
          },
          initialStyle: pipInitialStyleForStatusPip,
          startMinimized: true,
          lockMinimizedState: true,
          isVisible: true,
          showContentWhenMinimized: true,
          hideHeaderElements: true,
          isDraggable: false,
          onMouseEnter: () => setHoveredStatusPipId(pipConfig.id),
          onMouseLeave: () => {
              if (hoveredStatusPipIdRef.current === pipConfig.id) {
                  setHoveredStatusPipId(null);
              }
          }
        });
      })
    );
  }

  return <WorldView />;
}

return { App };
