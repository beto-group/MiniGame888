function WelcomeMessageComponent({
  dc,
  message,
  hasCardBeenClicked,
  categorizationStatus,
  onMessageSequenceComplete,
  isGameFinished,
  totalTries,
  finalMessageOptions,
  onClaimAndExit
}) {
  const { useState, useEffect, useRef } = dc;
  const initialWelcomeTextWithMarkers = message;
  const secondWelcomeTextRaw = "Pick a card to start exploring.";
  const thirdWelcomeTextRaw = "Very nice! Drag and categorize it.";
  const instructionMessageRaw = "Drag ENIGMA using the titlebar and move it into its corresponding NAMZU {category}";
  const failMessageRaw = "Oops, wrong one. Try again...";
  const successMessageRaw = "Nice! Now time to do them all 🫡";

  const timerRef = useRef(null);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const processText = (input) => {
    if (typeof input !== 'string') return '';
    let temp = input;
    temp = temp.replace(/experi\{m\}en\{T\}ce/i, 'EXPERIµENτCE');
    temp = temp.replace(/\{visual ledger\}/ig, '_VISUAL_LEDGER_');
    temp = temp.replace(/\{category\}/ig, '_CATEGORY_');
    temp = temp.toUpperCase();
    temp = temp.replace(/µ/g, 'm');
    temp = temp.replace(/τ/g, 't');
    temp = temp.replace(/_VISUAL_LEDGER_/g, 'VISUAL LEDGER');
    temp = temp.replace(/_CATEGORY_/g, 'CATEGORY');
    temp = temp.replace(/\{|\}/g, '');
    return temp;
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isGameFinished) {
      const finalMessage = finalMessageOptions.find(opt => totalTries >= opt.minTries && totalTries <= opt.maxTries)
        || { title: "Enigma Mastered", message: "Congratulations! You've completed the experience with a unique score. Every journey is a lesson learned." };

      const formattedMessage = `${finalMessage.title.toUpperCase()}\n\n${processText(finalMessage.message)}`;
      
      const handleClaimClick = () => {
        const claimUrl = 'https://www.crossmint.com/collections/beto888-experience/claim';
        window.open(claimUrl, '_blank');
        if (onClaimAndExit) {
          onClaimAndExit();
        }
      };

      const buttonStyleBase = {
        marginTop: '20px',
        padding: '12px 25px',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        color: 'var(--text-on-accent)',
        border: '2px solid var(--interactive-accent)',
        borderRadius: '8px',
        background: 'var(--interactive-accent)',
        boxShadow: '0 0 12px var(--interactive-accent)',
        transition: 'all 0.2s ease-in-out',
        outline: 'none',
      };

      const buttonStyleHover = {
        transform: 'scale(1.05)',
        boxShadow: '0 0 20px var(--interactive-accent)'
      };
      
      const finalButtonStyle = isButtonHovered ? { ...buttonStyleBase, ...buttonStyleHover } : buttonStyleBase;

      setDisplayedMessage(
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <pre style={{ margin: 0, paddingBottom: '10px', fontFamily: 'inherit', whiteSpace: 'pre-wrap', textAlign: 'center', color: 'var(--text-normal)' }}>{formattedMessage}</pre>
          <button 
            onClick={handleClaimClick} 
            style={finalButtonStyle}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
          >
            Claim Your NFT & Exit
          </button>
        </div>
      );
      return;
    }

    if (categorizationStatus === 'success') {
      setDisplayedMessage(processText(successMessageRaw));
      timerRef.current = setTimeout(() => {
        if (onMessageSequenceComplete) onMessageSequenceComplete();
      }, 8000);
    } else if (categorizationStatus === 'fail') {
      setDisplayedMessage(processText(failMessageRaw));
      timerRef.current = setTimeout(() => {
        setDisplayedMessage(processText(instructionMessageRaw));
      }, 4000);
    } else if (hasCardBeenClicked) {
      setDisplayedMessage(processText(thirdWelcomeTextRaw));
      timerRef.current = setTimeout(() => {
        setDisplayedMessage(processText(instructionMessageRaw));
      }, 8000);
    } else {
      setDisplayedMessage(processText(initialWelcomeTextWithMarkers));
      timerRef.current = setTimeout(() => {
        setDisplayedMessage(processText(secondWelcomeTextRaw));
      }, 6000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hasCardBeenClicked, categorizationStatus, onMessageSequenceComplete, initialWelcomeTextWithMarkers, isGameFinished, totalTries, finalMessageOptions, onClaimAndExit, isButtonHovered]);

  return (
    <div
      style={{
        color: 'var(--text-normal)',
        fontSize: '22px',
        textAlign: 'center',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontFamily: `'Consolas', 'Monaco', 'Lucida Console', 'monospace'`,
        textShadow: '0 0 10px var(--interactive-accent)',
        lineHeight: '1.4'
      }}
    >
      {displayedMessage}
    </div>
  );
}

return { WelcomeMessageComponent };
