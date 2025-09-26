import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  motion,
  AnimatePresence,
  Transition,
  type VariantLabels,
  type Target,
  type TargetAndTransition
} from 'framer-motion';

import './RotatingText.css';

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

export interface RotatingTextProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof motion.span>,
    'children' | 'transition' | 'initial' | 'animate' | 'exit'
  > {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  duration?: number;
  delay?: number;
  ease?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>((props, ref) => {
  const {
    text,
    className = '',
    tag = 'span',
    duration = 2,
    delay = 100,
    ease = 'easeInOut',
    ...rest
  } = props;

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const next = useCallback(() => {
    // Simple implementation for single text
  }, []);

  const previous = useCallback(() => {
    // Simple implementation for single text
  }, []);

  const jumpTo = useCallback((index: number) => {
    // Simple implementation for single text
  }, []);

  const reset = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      next,
      previous,
      jumpTo,
      reset
    }),
    [next, previous, jumpTo, reset]
  );

  const renderTag = () => {
    const style: React.CSSProperties = {
      willChange: 'transform, opacity'
    };
    const classes = `rotating-text ${className}`;
    
    switch (tag) {
      case 'h1':
        return (
          <h1 style={style} className={classes}>
            {text}
          </h1>
        );
      case 'h2':
        return (
          <h2 style={style} className={classes}>
            {text}
          </h2>
        );
      case 'h3':
        return (
          <h3 style={style} className={classes}>
            {text}
          </h3>
        );
      case 'h4':
        return (
          <h4 style={style} className={classes}>
            {text}
          </h4>
        );
      case 'h5':
        return (
          <h5 style={style} className={classes}>
            {text}
          </h5>
        );
      case 'h6':
        return (
          <h6 style={style} className={classes}>
            {text}
          </h6>
        );
      case 'p':
        return (
          <p style={style} className={classes}>
            {text}
          </p>
        );
      default:
        return (
          <span style={style} className={classes}>
            {text}
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: duration / 2, delay: delay / 1000, ease }}
      {...rest}
    >
      {renderTag()}
    </motion.div>
  );
});

RotatingText.displayName = 'RotatingText';
export default RotatingText;