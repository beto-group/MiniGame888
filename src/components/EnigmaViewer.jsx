function EnigmaView(props) {
  const {
    dc,
    loadScript,
    sourceMesh = null,
    titleText: propsTitleText = "ENIGMA",
    descriptionText: propsDescriptionText = "Behold the spinning artifact, a relic of unknown origins, pulsing with a subtle energy. Its facets catch the light, hinting at untold stories and veiled truths. What secrets does it safeguard? What destiny does its perpetual motion foretell? Ponder its mystery. The code is all around us.",
  } = props || {};

  const { useRef, useEffect, useState, useCallback } = dc;
  const canvasRef = useRef(null);
  const [engine, setEngine] = useState(null);
  const [scene, setScene] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const descriptionRef = useRef(null);
  const [isTextProcessed, setIsTextProcessed] = useState(false);

  const [currentTitleText, setCurrentTitleText] = useState(propsTitleText);
  const [currentDescriptionText, setCurrentDescriptionText] = useState(propsDescriptionText);

  useEffect(() => { setCurrentTitleText(propsTitleText); }, [propsTitleText]);
  useEffect(() => {
    setCurrentDescriptionText(propsDescriptionText);
    setIsTextProcessed(false); 
    if (descriptionRef.current) { delete descriptionRef.current.dataset.originalText; }
  }, [propsDescriptionText]);

  const initBabylon = async () => {
    if (!canvasRef.current || !window.BABYLON || !window.BABYLON.SceneLoader) {
      return () => {};
    }

    const babylonEngine = new window.BABYLON.Engine(
      canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true, antialias: true }
    );
    const babylonScene = new window.BABYLON.Scene(babylonEngine);
    const frameRate = 60; 

    const initialCameraBeta = Math.PI / 3.5;
    const finalCameraBeta = Math.PI / 2.5;
    const initialCameraRadius = 13;
    const finalCameraRadius = 10;

    const camera = new window.BABYLON.ArcRotateCamera(
      "Camera", -Math.PI / 2, initialCameraBeta, initialCameraRadius,
      window.BABYLON.Vector3.Zero(), babylonScene
    );
    camera.attachControl(canvasRef.current, true);
    camera.minZ = 0.1;
    camera.lowerRadiusLimit = Math.min(initialCameraRadius, finalCameraRadius);
    camera.upperRadiusLimit = Math.max(initialCameraRadius, finalCameraRadius)-2;
    camera.wheelPrecision = 50;

    const continuousCardZSpinSpeed = 0.008;
    let cardModelIntroSpinDone = false;

    // Use transparent background so it hovers over Obsidian theme background
    babylonScene.clearColor = new window.BABYLON.Color4(0, 0, 0, 0);
    const environment = babylonScene.createDefaultEnvironment({
      createSkybox: false, 
      enableGroundShadow: false,
      createGround: false,
      environmentTexture: "https://assets.babylonjs.com/environments/studio.env", 
      skyboxTexture: undefined,
      groundTexture: undefined,
      cameraExposure: 1.0,
      cameraContrast: 1.0,
      toneMappingEnabled: true,
    });
    if (environment && environment.ground) environment.ground.dispose();
    if (environment && environment.skybox) environment.skybox.dispose();
    babylonScene.environmentIntensity = 1.2;

    const directionalLight = new window.BABYLON.DirectionalLight(
      "directionalLight", new window.BABYLON.Vector3(0.5, -1, 0.5), babylonScene
    );
    directionalLight.intensity = 1.5;
    directionalLight.diffuse = new window.BABYLON.Color3(1.0, 0.95, 0.9);

    let mainModelMesh = null;
    let cardPivot = null;

    try {
      if (!sourceMesh) {
        return () => {};
      }

      const serializedMesh = window.BABYLON.SceneSerializer.SerializeMesh(sourceMesh, true, true);
      
      const parsedMesh = window.BABYLON.SceneLoader.ImportMesh(
        "", "", "data:" + JSON.stringify(serializedMesh), babylonScene,
        function (newMeshes) {
          // Import successful
        }
      );
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      mainModelMesh = babylonScene.meshes.find(m => 
        m.name.includes(sourceMesh.name) && m.getTotalVertices() > 0
      );
      
      if (!mainModelMesh) {
        mainModelMesh = babylonScene.meshes.filter(m => m.getTotalVertices() > 0).pop();
      }
      
      if (mainModelMesh) {
        mainModelMesh.name = "clonedCard";
        mainModelMesh.isVisible = false;
      } else {
        return () => {};
      }
      
      if (mainModelMesh) {
        cardPivot = new window.BABYLON.TransformNode("cardPivot", babylonScene);
        mainModelMesh.parent = cardPivot;

        mainModelMesh.position = window.BABYLON.Vector3.Zero();
        mainModelMesh.rotation = window.BABYLON.Vector3.Zero();
        mainModelMesh.scaling = new window.BABYLON.Vector3(2.5, 3.5, 3.5);

        mainModelMesh.getChildMeshes(false).forEach(childMesh => { if (childMesh.material) childMesh.material.backFaceCulling = false; });
        if (mainModelMesh.material) mainModelMesh.material.backFaceCulling = false;
        
        cardPivot.rotation.x = -Math.PI / 2.22;
        
        const cardInitialYOffset = -25;
        const cardAnimationDurationSeconds = 2.5;
        const cardIntroSpins = 5;
        const cardTotalFrames = cardAnimationDurationSeconds * frameRate;

        cardPivot.position = new window.BABYLON.Vector3(0, cardInitialYOffset, 0);
        const animPivotPositionY = new window.BABYLON.Animation("pivotIntroPositionY", "position.y", frameRate, window.BABYLON.Animation.ANIMATIONTYPE_FLOAT, window.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animPivotPositionY.setKeys([{ frame: 0, value: cardInitialYOffset }, { frame: cardTotalFrames, value: 0 }]);
        const animCardRotationZ = new window.BABYLON.Animation("cardIntroRotationZ", "rotation.z", frameRate, window.BABYLON.Animation.ANIMATIONTYPE_FLOAT, window.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCardRotationZ.setKeys([{ frame: 0, value: 0 }, { frame: cardTotalFrames, value: Math.PI * 2 * cardIntroSpins }]);
        const cardEasingFunction = new window.BABYLON.CubicEase();
        cardEasingFunction.setEasingMode(window.BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        animPivotPositionY.setEasingFunction(cardEasingFunction);
        animCardRotationZ.setEasingFunction(cardEasingFunction);

        const cameraAnimationDurationSeconds = 1.8;
        const cameraTotalFrames = cameraAnimationDurationSeconds * frameRate;
        const animCameraBeta = new window.BABYLON.Animation("cameraRevealBeta", "beta", frameRate, window.BABYLON.Animation.ANIMATIONTYPE_FLOAT, window.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCameraBeta.setKeys([{ frame: 0, value: initialCameraBeta }, { frame: cameraTotalFrames, value: finalCameraBeta }]);
        const animCameraRadius = new window.BABYLON.Animation("cameraRevealRadius", "radius", frameRate, window.BABYLON.Animation.ANIMATIONTYPE_FLOAT, window.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCameraRadius.setKeys([{ frame: 0, value: initialCameraRadius }, { frame: cameraTotalFrames, value: finalCameraRadius }]);
        const cameraEasingFunction = new window.BABYLON.SineEase();
        cameraEasingFunction.setEasingMode(window.BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        animCameraBeta.setEasingFunction(cameraEasingFunction);
        animCameraRadius.setEasingFunction(cameraEasingFunction);

        babylonScene.onBeforeRenderObservable.addOnce(() => {
          if (mainModelMesh) mainModelMesh.isVisible = true;
        });

        babylonScene.beginDirectAnimation(cardPivot, [animPivotPositionY], 0, cardTotalFrames, false, 1, () => { cardPivot.position.y = 0; });
        babylonScene.beginDirectAnimation(mainModelMesh, [animCardRotationZ], 0, cardTotalFrames, false, 1, () => {
          mainModelMesh.rotation.z = (Math.PI * 2 * cardIntroSpins) % (Math.PI * 2);
          cardModelIntroSpinDone = true;
          babylonScene.beginDirectAnimation(camera, [animCameraBeta, animCameraRadius], 0, cameraTotalFrames, false, 1, () => {
            camera.beta = finalCameraBeta; camera.radius = finalCameraRadius; camera.lowerRadiusLimit = finalCameraRadius; camera.upperRadiusLimit = finalCameraRadius;
          });
        });
      }
    } catch (error) {
      // Ignore mesh loading errors
    }

    setEngine(babylonEngine); setScene(babylonScene);
    babylonScene.onPointerDown = (evt, pickResult) => {
      if (evt.button === 0) {
        camera.lowerRadiusLimit = 1; camera.upperRadiusLimit = 11;
        const meshToFit = mainModelMesh;
        if (pickResult && pickResult.hit && pickResult.pickedMesh && meshToFit && pickResult.pickedMesh.isDescendantOf(meshToFit.parent || meshToFit) ) {
          if (meshToFit.getBoundingInfo()) {
            const boundingInfo = meshToFit.getBoundingInfo();
            const modelVisualRadius = boundingInfo.boundingSphere.radiusWorld * Math.max(meshToFit.scaling.x, meshToFit.scaling.y, meshToFit.scaling.z);
            const desiredRadiusOnClick = modelVisualRadius * 3;
            const animZoomOnClick = new window.BABYLON.Animation("cameraZoomOnClick", "radius", frameRate, window.BABYLON.Animation.ANIMATIONTYPE_FLOAT, window.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            animZoomOnClick.setKeys([{ frame: 0, value: camera.radius }, { frame: 30, value: desiredRadiusOnClick } ]);
            const easing = new window.BABYLON.QuinticEase();
            easing.setEasingMode(window.BABYLON.EasingFunction.EASINGMODE_EASEOUT);
            animZoomOnClick.setEasingFunction(easing);
            camera.animations = camera.animations.filter(anim => anim.name !== "cameraZoomOnClick");
            camera.animations.push(animZoomOnClick);
            babylonScene.beginAnimation(camera, 0, 30, false);
          }
        }
      }
    };
    babylonEngine.runRenderLoop(() => {
      if (babylonScene && babylonScene.activeCamera && !babylonEngine.isDisposed) {
        if (cardModelIntroSpinDone && mainModelMesh) mainModelMesh.rotation.z += continuousCardZSpinSpeed;
        babylonScene.render();
      }
    });
    const resizeHandler = () => { if (babylonEngine && !babylonEngine.isDisposed) babylonEngine.resize(); };
    window.addEventListener("resize", resizeHandler);
    const canvasElement = canvasRef.current;
    const handleWheel = (e) => e.preventDefault();
    if (canvasElement) canvasElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("resize", resizeHandler);
      if (canvasElement) canvasElement.removeEventListener("wheel", handleWheel);
      if (babylonEngine) {
        babylonEngine.stopRenderLoop();
        if (camera && camera.animations) camera.animations = [];
        if (cardPivot) cardPivot.dispose();
        else if (mainModelMesh) mainModelMesh.dispose();
        if (babylonScene) babylonScene.dispose();
        babylonEngine.dispose();
      }
      setEngine(null); setScene(null); mainModelMesh = null; cardPivot = null; cardModelIntroSpinDone = false;
    };
  };

  useEffect(() => {
    let cleanupBabylonFunc = () => {};
    const loadedScripts = [];
    const setupEnvironment = async () => {
      if (!sourceMesh) {
        return;
      }
      
      try {
        if (!window.BABYLON || !window.BABYLON.SceneLoader) {
          loadedScripts.push(await loadScript(dc, "https://cdn.babylonjs.com/babylon.js"));
          loadedScripts.push(await loadScript(dc, "https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"));
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        if (canvasRef.current && window.BABYLON && window.BABYLON.SceneLoader) {
          if (engine && typeof cleanupBabylonFunc === 'function') { 
            cleanupBabylonFunc();
          }
          cleanupBabylonFunc = await initBabylon();
        }
      } catch (error) { /* Ignore Babylon setup errors */ }
    };
    setupEnvironment();
    return () => {
      if (typeof cleanupBabylonFunc === 'function') {
        cleanupBabylonFunc();
      }
    };
  }, [refreshKey, sourceMesh]);

  useEffect(() => {
    if (descriptionRef.current && !isTextProcessed && currentDescriptionText) {
      const pElement = descriptionRef.current;
      pElement.innerHTML = ''; 
      const characters = currentDescriptionText.split('');
      characters.forEach((char, index) => {
        if (char === '\n') pElement.appendChild(document.createElement('br'));
        else if (char === ' ') pElement.appendChild(document.createTextNode(' '));
        else if (char.trim() !== '') { 
          const span = document.createElement('span'); span.textContent = char;
          const baseDelay = index*0.05; const rDelay=(Math.random()-0.5)*0.08; span.style.animationDelay = `${Math.max(0, baseDelay + rDelay)}s`;
          const baseDur=3.0; const rDur=(Math.random()-0.5)*0.6; span.style.animationDuration = `${Math.max(1.8, baseDur + rDur)}s`;
          span.className = 'animated-letter'; pElement.appendChild(span);
        } else pElement.appendChild(document.createTextNode(char));
      });
      setIsTextProcessed(true); 
    } else if (!currentDescriptionText && descriptionRef.current) {
      descriptionRef.current.innerHTML = '';
      setIsTextProcessed(true);
    }
  }, [currentDescriptionText, isTextProcessed]);

  // Palette
  const pAccent = '#C77DF2'; 
  const pAccentRgba = (alpha) => `rgba(199, 125, 242, ${alpha})`;
  const pText = '#DAB3F9'; 
  const pTextRgba = (alpha) => `rgba(218, 179, 249, ${alpha})`;
  const pDark = '#5E2A72'; 
  const pDarkRgba = (alpha) => `rgba(94, 42, 114, ${alpha})`;
  const pVeryDarkBg = 'var(--background-secondary)'; 
  const pTextBoxBg = 'rgba(45, 20, 55, 0.93)'; 
  const pPulseHighlight = '#E6C3FC'; 
  const pPulseHighlightRgba = (alpha) => `rgba(230, 195, 252, ${alpha})`;
  const pInitialLetterColor = 'var(--text-normal)';
  const pIntermediateColor1 = '#F0E6F7'; 
  const pIntermediateColor2 = '#E0C9FA'; 

  const cssStyles = `
    .refresh-button { background-color: ${pVeryDarkBg}; transition: background-color 0.3s ease, transform 0.1s ease, box-shadow 0.3s ease; box-sizing: border-box; border: 1px solid var(--background-modifier-border); color: ${pAccent}; position:absolute; top:10px; right:10px; z-index: 10; width:44px; height:44px; border-radius:50%; display:flex; justify-content:center; align-items:center; cursor:pointer; outline:none; }
    .refresh-button:hover { background-color: ${pDark}; transform: scale(1.05); box-shadow: 0 0 10px ${pAccent}, 0 0 5px ${pAccent} inset; }
    .refresh-button:active { transform: scale(0.95); box-shadow: 0 0 5px ${pAccent}, 0 0 2px ${pAccent} inset; }
    .text-content-box { width: 100%; max-width: 800px; padding: 20px; margin-top: 30px; background-color: ${pTextBoxBg}; border-radius: 8px; box-sizing: border-box; border: 1px solid ${pDarkRgba(0.8)}; box-shadow: 0 0 25px ${pAccentRgba(0.25)}, 0 0 15px ${pDarkRgba(0.6)} inset; position: relative; overflow: hidden; }
    .text-content-box::before { content: ""; position: absolute; top: -10%; left: -10%; width: 120%; height: 120%; background-image: repeating-linear-gradient(0deg, transparent, transparent 1px, ${pAccentRgba(0.03)} 1px, ${pAccentRgba(0.03)} 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, ${pAccentRgba(0.02)} 1px, ${pAccentRgba(0.02)} 2px); background-size: 3px 3px; opacity: 0.5; animation: matrixGridJitter 0.15s steps(1) infinite; pointer-events: none; z-index: 0; }
    @keyframes matrixGridJitter { 0%{transform:translate(0px,0px);} 20%{transform:translate(-1px,1px);} 40%{transform:translate(1px,-1px);} 60%{transform:translate(-1px,-1px);} 80%{transform:translate(1px,1px);} 100%{transform:translate(0px,0px);} }
    .enigma-title { margin-top: 0; margin-bottom: 20px; color: ${pAccent}; font-size: 2.2em; text-align: center; font-weight: normal; font-family: 'Courier New', Courier, monospace; text-shadow: 0 0 8px ${pAccent}, 0 0 12px ${pAccentRgba(0.7)}, 0 0 1px transparent; position: relative; z-index: 1; animation: titlePulsePurple 3s ease-in-out infinite; }
    @keyframes titlePulsePurple { 0%,100%{text-shadow:0 0 8px ${pAccent},0 0 12px ${pAccentRgba(0.7)};opacity:1;} 50%{text-shadow:0 0 12px ${pPulseHighlight},0 0 18px ${pPulseHighlightRgba(0.6)};opacity:0.8;} }
    .enigma-description { margin-bottom:0; line-height:1.6; font-size:1.1em; text-align:justify; color:${pInitialLetterColor}; font-family:'Courier New',Courier,monospace; position:relative; z-index:1; overflow-wrap:break-word; word-wrap:break-word; min-height: 1.6em; }
    .enigma-description .animated-letter { animation-name:letterColorShift; animation-timing-function:linear; animation-iteration-count:infinite; }
    @keyframes letterColorShift { 0%,100%{color:${pInitialLetterColor};text-shadow:none;} 12%{color:${pIntermediateColor1};} 25%{color:${pIntermediateColor2};} 40%{color:${pText};text-shadow:0 0 3px ${pTextRgba(0.5)};} 60%{color:${pAccent};text-shadow:0 0 5px ${pAccentRgba(0.7)};} 75%{color:${pText};text-shadow:0 0 3px ${pTextRgba(0.5)};} 88%{color:${pIntermediateColor2};} }
  `;
  
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", background: "var(--background-primary)" }}>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "800px", height: "260px", overflow: "hidden", padding: "10px", borderRadius: "8px" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        <button onClick={() => { setRefreshKey(prevKey => prevKey + 1); }} className="refresh-button" aria-label="Refresh Scene" title="Refresh Scene">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </button>
      </div>
      <div className="text-content-box">
        <h2 className="enigma-title">{currentTitleText}</h2>
        <p className="enigma-description" ref={descriptionRef}>
          {!isTextProcessed && currentDescriptionText ? currentDescriptionText : ""}
        </p>
      </div>
    </div>
  );
}

return { EnigmaView };
