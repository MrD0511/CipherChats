import { useEffect, useRef } from 'react';

const useAutoResizeTextArea = (value) => {
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = scrollHeight + 'px';
    }
  }, [value]);

  return textAreaRef;
};

export default useAutoResizeTextArea;