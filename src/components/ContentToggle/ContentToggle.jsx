import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ContentToggle.module.css";

const ContentToggle = ({
  expandedLabel,
  collapsedLabel,
  children,
  disabled,
  onExpand,
  onCollapse,
  labelClass,
  isExpanded: controlledIsExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(controlledIsExpanded);
  const contentRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setIsExpanded(controlledIsExpanded);
  }, [controlledIsExpanded]);

  useEffect(() => {
    if (contentRef.current && wrapperRef.current) {
      const height = contentRef.current.scrollHeight;
      if (isExpanded) {
        wrapperRef.current.style.setProperty('--content-max-height', `${height}px`);
        setTimeout(() => {
          wrapperRef.current.style.setProperty('--content-max-height', 'none');
          onExpand?.();
        }, 300);
      } else {
        wrapperRef.current.style.setProperty('--content-max-height', `${height}px`);
        requestAnimationFrame(() => {
          wrapperRef.current.style.setProperty('--content-max-height', '0px');
          onCollapse?.();
        });
      }
    }
  }, [isExpanded, onExpand, onCollapse]);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Space') {
      event.preventDefault();
      toggleExpand();
    }
  }, [toggleExpand]);

  return (
    <div className={styles.container}>
      <button
        className={styles.header}
        disabled={disabled}
        onClick={toggleExpand}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        type="button"
      >
        <span
          className={`${styles.arrow} ${isExpanded ? styles.arrowExpanded : ""}`}
          aria-hidden="true"
        >
          ▶
        </span>

        <span className={labelClass}>
          {isExpanded ? expandedLabel : collapsedLabel}
        </span>
      </button>
      <div ref={wrapperRef} className={styles.contentWrapper}>
        <div ref={contentRef} className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export { ContentToggle };
