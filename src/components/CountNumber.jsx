import { useEffect, useRef } from 'react';
import { countTo } from '../lib/motion.js';

/** Renders a number that rolls to each new value; screen readers get the final text. */
export function CountNumber({ value, format }) {
  const element = useRef(null);
  const previous = useRef(0);

  useEffect(() => {
    countTo(element.current, previous.current, value, format);
    previous.current = value;
  }, [value, format]);

  return <span ref={element} className="count-number" role="text" aria-label={format(value)} />;
}
