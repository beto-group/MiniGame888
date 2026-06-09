function StatusPipContentComponent({
    text,
    textColor = 'var(--text-normal)',
    pipDiameter,
    isHoveredByDrag,
    isHoveredByCursorOnly,
    hoverTextColor
}) {
  const uniqueId = `textCirclePath-${text.replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2,7)}`;

  const fontSize = 14; 
  const pipVisualRadius = pipDiameter / 2; 
  const textOffsetFromPipEdge = 4; 
  const textPathRadius = pipVisualRadius + textOffsetFromPipEdge; 

  const svgContentMaxRadius = textPathRadius + (fontSize / 2) + 2; 
  const svgEffectiveDiameter = svgContentMaxRadius * 2; 

  const svgStyle = {
    width: `${svgEffectiveDiameter}px`,
    height: `${svgEffectiveDiameter}px`,
    overflow: 'visible',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)', 
    transition: 'transform 0.2s ease-out',
  };

  let currentFillColor = textColor;
  let animationPlayState = 'running';

  if (isHoveredByDrag) {
    currentFillColor = hoverTextColor || 'var(--interactive-accent)';
    animationPlayState = 'paused';
  }

  const textStyle = {
    fontSize: `${fontSize}px`,
    fill: currentFillColor,
    fontFamily: 'var(--font-interface), sans-serif',
    fontWeight: 'bold',
    userSelect: 'none',
    transition: 'fill 0.2s ease-out',
  };

  const viewBoxCenterX = svgEffectiveDiameter / 2;
  const viewBoxCenterY = svgEffectiveDiameter / 2;

  const pathD = `M ${viewBoxCenterX - textPathRadius}, ${viewBoxCenterY} a ${textPathRadius},${textPathRadius} 0 1,1 ${textPathRadius * 2},0 a ${textPathRadius},${textPathRadius} 0 1,1 -${textPathRadius * 2},0`;

  let gRotation = 0; 

  if (text.toUpperCase().includes('SYSTEMS')) {
    gRotation = -60; 
  } else if (text.toUpperCase().includes('PERCEPTION')) {
    gRotation = -60; 
  } else if (text.toUpperCase().includes('STRATEGY')) {
    gRotation = 60; 
  }

  return (
    <svg style={svgStyle} viewBox={`0 0 ${svgEffectiveDiameter} ${svgEffectiveDiameter}`}>
      <defs>
        <path id={uniqueId} d={pathD} fill="none" stroke="none" />
      </defs>
      <g
        style={{
          animation: 'spinTextAround 20s linear infinite',
          animationPlayState: animationPlayState,
          transformOrigin: `${viewBoxCenterX}px ${viewBoxCenterY}px`, 
          transform: `rotate(${gRotation}deg)`, 
          transition: 'transform 0.2s ease-out'
        }}
      >
        <text style={{...textStyle, animation: 'none'}}>
          <textPath href={`#${uniqueId}`} startOffset="0%" dominantBaseline="middle" textAnchor="start">
            {text.toUpperCase()}
          </textPath>
        </text>
      </g>
    </svg>
  );
}

return { StatusPipContentComponent };
