import { useEffect, useRef } from 'react';
import { flapDigit } from '../lib/motion.js';

function FlapCell({ character }) {
  const cell = useRef(null);
  const previous = useRef(character);

  useEffect(() => {
    if (previous.current !== character) flapDigit(cell.current);
    previous.current = character;
  }, [character]);

  const isDigit = /\d/.test(character);
  return (
    <span ref={cell} className={isDigit ? 'flap-cell' : 'flap-sep'}>
      {character}
    </span>
  );
}

/** Renders a formatted number as split-flap tiles; screen readers get the plain value. */
export function FlapNumber({ value }) {
  const characters = [...value];
  return (
    <span className="flap" role="text" aria-label={value}>
      {characters.map((character, index) => (
        <FlapCell key={characters.length - index} character={character} />
      ))}
    </span>
  );
}
