const { useRef, useEffect, useState } = dc;

const DEFAULT_FALLBACK_ZINDEX = 10000;
let highestZIndex = 10000;

function updateHighestZIndex() {
  let max = 0;
  document.querySelectorAll('.fresh-pip').forEach((el) => {
    if (!document.body.contains(el) || el.style.display === 'none' || el.style.visibility === 'hidden') return;
    let computedZStr = window.getComputedStyle(el).zIndex;
    let z = (computedZStr === "auto" || computedZStr === "")
      ? (parseInt(el.style.zIndex, 10) || DEFAULT_FALLBACK_ZINDEX)
      : (parseInt(computedZStr, 10) || 0);
    if (z > max) max = z;
  });
  if (max < DEFAULT_FALLBACK_ZINDEX) max = DEFAULT_FALLBACK_ZINDEX;
  if (max === 0 && highestZIndex > 0) return highestZIndex;
  highestZIndex = max;
  return highestZIndex;
}

function bringToFront(container, fallback = 0) {
  if (!container || container.style.display === 'none' || container.style.visibility === 'hidden') return;
  updateHighestZIndex();
  let targetZ = highestZIndex + 1;
  if (fallback && targetZ < fallback) {
    targetZ = fallback;
  }

  const currentZ = parseInt(container.style.zIndex, 10) || 0;
  if (currentZ < targetZ) {
    highestZIndex = targetZ;
    container.style.setProperty("z-index", highestZIndex, "important");
  }
}

const PIP_HEADER_HEIGHT_NUM = 55;
const PIP_HEADER_HEIGHT = `${PIP_HEADER_HEIGHT_NUM}px`;
const PIP_MINIMIZED_SIZE_NUM = 80;
const PIP_MINIMIZED_SIZE = `${PIP_MINIMIZED_SIZE_NUM}px`;

const DEFAULT_PIP_WIDTH = "400px";
const DEFAULT_PIP_HEIGHT = "799px";
const DEFAULT_PIP_HEIGHT_NUM = 799;
const DEFAULT_PIP_TOP = `calc(50vh - ${DEFAULT_PIP_HEIGHT_NUM / 2}px)`;
const DEFAULT_PIP_LEFT = "50px";
const DEFAULT_PIP_BORDER_RADIUS = "8px";

function FreshPip({
  dc,
  onClose,
  pipId,
  filePath,
  header,
  functionName,
  component,
  componentProps = {},
  initialStyle = {},
  startMinimized = false,
  lockMinimizedState = false,
  showContentWhenMinimized = false,
  hideHeaderElements = false,
  isDraggable = true,
  onDragStateChange,
  isVisible = true,
  titleText
}) {
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const [LoadedComponent, setLoadedComponent] = useState(() => component || null);
  const [isBeingDraggedInternal, setIsBeingDraggedInternal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(startMinimized || lockMinimizedState);
  const [isShaking, setIsShaking] = useState(false);

  const originalStylesRef = useRef({});
  const dragStartDataRef = useRef({});
  const previousPipIdRef = useRef(pipId);
  const lastDropPositionRef = useRef(null);

  const defaultPipBaseStyleRef = useRef({
    position: "fixed",
    backgroundColor: "var(--background-secondary)",
    border: "2px solid var(--background-modifier-border)",
    boxSizing: "border-box",
    padding: "0px",
    overflow: "visible",
    zIndex: DEFAULT_FALLBACK_ZINDEX,
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease-out, height 0.2s ease-out, border-radius 0.2s ease-out, box-shadow 0.2s ease-out, top 0.2s ease-out, left 0.2s ease-out, right 0.2s ease-out',
  });

  useEffect(() => {
    if (component) {
      setLoadedComponent(() => component);
      return;
    }
    if (!filePath || !functionName) {
      setLoadedComponent(() => () => <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>(No Content Source)</div>);
      return;
    }
    (async () => {
      try {
        const dynamicModule = await dc.require(dc.headerLink(filePath, header));
        const Comp = dynamicModule[functionName];
        if (Comp) setLoadedComponent(() => Comp);
        else {
          setLoadedComponent(() => () => <div style={{ color: 'var(--text-error)', padding: '20px' }}>Error: Component {functionName} not found.</div>);
        }
      } catch (error) {
        setLoadedComponent(() => () => <div style={{ color: 'var(--text-error)', padding: '20px' }}>Error loading: {error.message}</div>);
      }
    })();
  }, [component, filePath, header, functionName, pipId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (pipId !== previousPipIdRef.current || Object.keys(originalStylesRef.current).length === 0) {
      originalStylesRef.current = {
        width: initialStyle.width || DEFAULT_PIP_WIDTH,
        height: initialStyle.height || DEFAULT_PIP_HEIGHT,
        top: initialStyle.top || DEFAULT_PIP_TOP,
        left: initialStyle.left || (initialStyle.right !== undefined && initialStyle.right !== 'auto' ? 'auto' : DEFAULT_PIP_LEFT),
        right: initialStyle.right || 'auto',
        borderRadius: initialStyle.borderRadius || DEFAULT_PIP_BORDER_RADIUS,
      };
      Object.entries(originalStylesRef.current).forEach(([prop, value]) => {
        if (!container.style[prop] || container.style[prop] === '0px' || container.style[prop] === '') {
          container.style[prop] = value;
        }
      });

      if (!lockMinimizedState) {
        setIsMinimized(startMinimized);
      }
      lastDropPositionRef.current = null;
    }
    previousPipIdRef.current = pipId;

    if (isVisible) {
      const initialZIndex = parseInt(initialStyle.zIndex, 10) || DEFAULT_FALLBACK_ZINDEX;
      bringToFront(container, initialZIndex);
    } else {
      container.style.zIndex = 'auto';
    }

    const handlePointerDownBringToFront = (e) => {
      if (isVisible && !(headerRef.current && headerRef.current.contains(e.target) && e.target.closest('button'))) {
        bringToFront(container);
      }
    };
    container.addEventListener("pointerdown", handlePointerDownBringToFront, true);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDownBringToFront, true);
    };
  }, [pipId, isVisible, lockMinimizedState, startMinimized, initialStyle]);

  useEffect(() => {
    if (isShaking) {
      const timeout = setTimeout(() => {
        setIsShaking(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isShaking]);

  useEffect(() => {
    if (!isDraggable || !isVisible) return;
    const container = containerRef.current;
    const dragHeaderEl = headerRef.current;
    if (!container || !dragHeaderEl) return;

    const handleMouseDownOnHeader = (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      setIsBeingDraggedInternal(true);
      lastDropPositionRef.current = null;

      if (onDragStateChange) {
        onDragStateChange(pipId, true, componentProps);
      }

      const rect = container.getBoundingClientRect();

      if (lockMinimizedState) {
        dragStartDataRef.current = {
          clickOffsetXOnPip: e.clientX - rect.left,
          clickOffsetYOnPip: e.clientY - rect.top,
          isRightAnchored: getComputedStyle(container).left === 'auto' && getComputedStyle(container).right !== 'auto',
        };
        container.style.transition = (container.style.transition || defaultPipBaseStyleRef.current.transition)
          .replace(/top 0\.\d+s ease[^,]*,?/g, '')
          .replace(/left 0\.\d+s ease[^,]*,?/g, '')
          .replace(/right 0\.\d+s ease[^,]*,?/g, '') + ', top 0s, left 0s, right 0s';
      } else {
        if (Object.keys(originalStylesRef.current).length === 0) {
          originalStylesRef.current = {
            width: DEFAULT_PIP_WIDTH, height: DEFAULT_PIP_HEIGHT,
            top: DEFAULT_PIP_TOP, left: DEFAULT_PIP_LEFT,
            right: 'auto', borderRadius: DEFAULT_PIP_BORDER_RADIUS,
          };
        }
        dragStartDataRef.current = {
          minimizedCircleCenterOffsetX: PIP_MINIMIZED_SIZE_NUM / 2,
          minimizedCircleCenterOffsetY: PIP_MINIMIZED_SIZE_NUM / 2,
        };

        container.style.top = `${e.clientY - dragStartDataRef.current.minimizedCircleCenterOffsetY}px`;
        container.style.left = `${e.clientX - dragStartDataRef.current.minimizedCircleCenterOffsetX}px`;
        container.style.right = 'auto';
        container.style.width = PIP_MINIMIZED_SIZE;
        container.style.height = PIP_MINIMIZED_SIZE;
        container.style.borderRadius = '50%';
        container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        container.style.transition = 'width 0.2s ease-out, height 0.2s ease-out, border-radius 0.2s ease-out, box-shadow 0.2s ease-out, top 0s, left 0s, right 0s';

        if (!isMinimized) {
          setIsMinimized(true);
        }
      }
    };

    const handleMouseMove = (e) => {
      if (!isBeingDraggedInternal || !isVisible) return;

      if (lockMinimizedState) {
        const newTop = e.clientY - dragStartDataRef.current.clickOffsetYOnPip;
        const currentWidth = parseFloat(getComputedStyle(container).width);
        if (dragStartDataRef.current.isRightAnchored) {
          const newRight = window.innerWidth - e.clientX - (currentWidth - dragStartDataRef.current.clickOffsetXOnPip);
          container.style.left = 'auto'; container.style.right = `${newRight}px`;
        } else {
          const newLeft = e.clientX - dragStartDataRef.current.clickOffsetXOnPip;
          container.style.left = `${newLeft}px`; container.style.right = 'auto';
        }
        container.style.top = `${newTop}px`;
      } else {
        const newTop = e.clientY - dragStartDataRef.current.minimizedCircleCenterOffsetY;
        const newLeft = e.clientX - dragStartDataRef.current.minimizedCircleCenterOffsetX;
        container.style.top = `${newTop}px`;
        container.style.left = `${newLeft}px`;
        container.style.right = 'auto';
      }
    };

    const handleMouseUp = (e) => {
      if (!isBeingDraggedInternal) return;
      const wasDraggingLcl = isBeingDraggedInternal;
      setIsBeingDraggedInternal(false);

      let dropHandledByParent = false;
      if (onDragStateChange) {
        dropHandledByParent = onDragStateChange(pipId, false, componentProps) || false;
      }

      if (!isVisible) {
        if (container.style.transition.includes('top 0s')) {
          container.style.transition = defaultPipBaseStyleRef.current.transition;
        }
        return;
      }

      if (lockMinimizedState) {
        if (containerRef.current) {
          const newComputed = getComputedStyle(containerRef.current);
          originalStylesRef.current = {
            ...originalStylesRef.current,
            width: containerRef.current.style.width,
            height: containerRef.current.style.height,
            borderRadius: containerRef.current.style.borderRadius,
            top: newComputed.top,
            left: newComputed.left,
            right: newComputed.right,
          };
          container.style.transition = defaultPipBaseStyleRef.current.transition;
        }
      } else if (wasDraggingLcl) {
        if (dropHandledByParent) {
          if (containerRef.current) {
            const finalRect = containerRef.current.getBoundingClientRect();
            lastDropPositionRef.current = {
              top: `${finalRect.top}px`,
              left: `${finalRect.left}px`,
              right: getComputedStyle(containerRef.current).right !== 'auto' ? getComputedStyle(containerRef.current).right : 'auto'
            };
          }
        } else {
          setIsShaking(true);
          setIsMinimized(false);
          lastDropPositionRef.current = null;
          requestAnimationFrame(() => {
            if (containerRef.current && Object.keys(originalStylesRef.current).length > 0 && isVisible) {
              containerRef.current.style.top = originalStylesRef.current.top;
              containerRef.current.style.left = originalStylesRef.current.left;
              containerRef.current.style.right = originalStylesRef.current.right || 'auto';
              containerRef.current.style.width = originalStylesRef.current.width;
              containerRef.current.style.height = originalStylesRef.current.height;
              containerRef.current.style.borderRadius = originalStylesRef.current.borderRadius;
              containerRef.current.style.boxShadow = 'none';
              containerRef.current.style.transition = defaultPipBaseStyleRef.current.transition;
            }
          });
        }
      } else {
        if (container) container.style.transition = defaultPipBaseStyleRef.current.transition;
      }
    };

    dragHeaderEl.addEventListener("mousedown", handleMouseDownOnHeader);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      dragHeaderEl.removeEventListener("mousedown", handleMouseDownOnHeader);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggable, isVisible, pipId, onDragStateChange, componentProps, lockMinimizedState, isMinimized]);

  let currentPipStyle = { ...defaultPipBaseStyleRef.current };

  if (Object.keys(originalStylesRef.current).length > 0) {
    currentPipStyle.width = originalStylesRef.current.width;
    currentPipStyle.height = originalStylesRef.current.height;
    currentPipStyle.top = originalStylesRef.current.top;
    currentPipStyle.left = originalStylesRef.current.left;
    currentPipStyle.right = originalStylesRef.current.right;
    currentPipStyle.borderRadius = originalStylesRef.current.borderRadius;
    currentPipStyle.boxShadow = 'none';
  } else {
    const fallbackInitial = initialStyle.width ? initialStyle : {
      width: DEFAULT_PIP_WIDTH, height: DEFAULT_PIP_HEIGHT, top: DEFAULT_PIP_TOP,
      left: DEFAULT_PIP_LEFT, right: 'auto', borderRadius: DEFAULT_PIP_BORDER_RADIUS
    };
    currentPipStyle = { ...currentPipStyle, ...fallbackInitial };
  }

  currentPipStyle = { ...currentPipStyle, ...initialStyle };

  if (lockMinimizedState) {
    currentPipStyle.width = initialStyle.width && initialStyle.width !== DEFAULT_PIP_WIDTH ? initialStyle.width : PIP_MINIMIZED_SIZE;
    currentPipStyle.height = initialStyle.height && initialStyle.height !== DEFAULT_PIP_HEIGHT ? initialStyle.height : PIP_MINIMIZED_SIZE;
    currentPipStyle.borderRadius = initialStyle.borderRadius || "50%";
    currentPipStyle.boxShadow = initialStyle.boxShadow || '0 4px 12px rgba(0,0,0,0.3)';
    if (isBeingDraggedInternal) {
      currentPipStyle.transition = 'width 0.2s ease-out, height 0.2s ease-out, border-radius 0.2s ease-out, box-shadow 0.2s ease-out, top 0s, left 0s, right 0s';
      if (containerRef.current?.style.top) {
        currentPipStyle.top = containerRef.current.style.top;
        currentPipStyle.left = containerRef.current.style.left;
        currentPipStyle.right = containerRef.current.style.right;
      }
    } else {
      currentPipStyle.transition = defaultPipBaseStyleRef.current.transition;
    }
  } else if (isMinimized || isBeingDraggedInternal) {
    currentPipStyle.width = PIP_MINIMIZED_SIZE;
    currentPipStyle.height = PIP_MINIMIZED_SIZE;
    currentPipStyle.borderRadius = "50%";
    currentPipStyle.boxShadow = initialStyle.boxShadow || '0 4px 12px rgba(0,0,0,0.3)';

    if (isBeingDraggedInternal) {
      currentPipStyle.transition = 'width 0.2s ease-out, height 0.2s ease-out, border-radius 0.2s ease-out, box-shadow 0.2s ease-out, top 0s, left 0s, right 0s';
      if (containerRef.current?.style.top) {
        currentPipStyle.top = containerRef.current.style.top;
        currentPipStyle.left = containerRef.current.style.left;
        currentPipStyle.right = containerRef.current.style.right;
      }
    } else {
      currentPipStyle.transition = defaultPipBaseStyleRef.current.transition;
      if (lastDropPositionRef.current) {
        currentPipStyle.top = lastDropPositionRef.current.top;
        currentPipStyle.left = lastDropPositionRef.current.left;
        currentPipStyle.right = lastDropPositionRef.current.right;
      } else if (containerRef.current?.style.top && containerRef.current?.style.width === PIP_MINIMIZED_SIZE) {
        currentPipStyle.top = containerRef.current.style.top;
        currentPipStyle.left = containerRef.current.style.left;
        currentPipStyle.right = containerRef.current.style.right;
      }
    }
  } else {
    currentPipStyle.transition = defaultPipBaseStyleRef.current.transition;
    if (lastDropPositionRef.current && !isBeingDraggedInternal) {
      currentPipStyle.top = lastDropPositionRef.current.top;
      currentPipStyle.left = lastDropPositionRef.current.left;
      currentPipStyle.right = lastDropPositionRef.current.right;
    }
  }

  if (!isVisible) {
    currentPipStyle.display = 'none';
  } else {
    currentPipStyle.display = defaultPipBaseStyleRef.current.display;
  }

  const isEffectivelyMinimizedOrHeaderless = hideHeaderElements || isMinimized || lockMinimizedState;

  const headerBarStyle = {
    height: hideHeaderElements ? '0px' : PIP_HEADER_HEIGHT,
    width: '100%',
    backgroundColor: hideHeaderElements ? 'transparent' : "var(--background-primary-alt)",
    display: hideHeaderElements ? "none" : "flex",
    alignItems: "center", justifyContent: "space-between", padding: "0 10px",
    cursor: (isDraggable && isVisible && !hideHeaderElements) ? "move" : "default",
    flexShrink: 0, userSelect: 'none',
    borderBottom: (isMinimized || lockMinimizedState || hideHeaderElements) ? 'none' : '1px solid var(--background-modifier-border)',
    boxSizing: 'border-box', position: 'relative',
    zIndex: 1,
  };

  const pipContentStyle = {
    flexGrow: 1,
    overflow: (isEffectivelyMinimizedOrHeaderless && showContentWhenMinimized) ? "visible" : "hidden",
    display: "flex",
    flexDirection: 'column',
    width: '100%',
    height: hideHeaderElements ? '100%' : `calc(100% - ${PIP_HEADER_HEIGHT})`,
    position: 'relative',
    top: 0, left: 0,
    alignItems: hideHeaderElements ? 'center' : 'stretch',
    justifyContent: hideHeaderElements ? 'center' : 'flex-start',
    padding: hideHeaderElements ? '0px' : '10px',
    boxSizing: 'border-box',
  };

  const cardDefForTitle = componentProps.cardDefinition;
  let pipTitle;

  if (titleText !== undefined) {
    pipTitle = titleText;
  } else {
    pipTitle = componentProps.titleText || (cardDefForTitle ? cardDefForTitle.title : (functionName || "PiP Window"));
  }

  const DisplayedComponent = LoadedComponent;

  return (
    <div
      ref={containerRef}
      className={`fresh-pip ${isShaking ? 'pip-shaking' : ''}`}
      style={currentPipStyle}
    >
      {!hideHeaderElements && (
        <div ref={headerRef} className="fresh-pip-header" style={headerBarStyle}>
          <span style={{ color: "var(--text-muted)", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: '10px' }}>
            {pipTitle}
          </span>
          {onClose && (
            <button
              style={{ cursor: "pointer", background: "var(--interactive-normal)", border: "1px solid var(--background-modifier-border)", color: "var(--text-normal)", fontSize: "14px", borderRadius: "3px", padding: "2px 5px", lineHeight: '1' }}
              onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
              ✕
            </button>
          )}
        </div>
      )}
      <div className="fresh-pip-content" style={pipContentStyle}>
        {DisplayedComponent ? (
          <DisplayedComponent {...componentProps} dc={dc} isPipMinimized={isMinimized || lockMinimizedState} pipDiameter={parseFloat(currentPipStyle.width)} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", userSelect: "none", fontSize: '12px' }}>Loading...</div>
        )}
      </div>
    </div>
  );
}

return { FreshPip };
