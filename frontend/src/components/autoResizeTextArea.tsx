import { useEffect, useRef } from 'react';

interface UseAutoResizeTextAreaReturn {
  current: HTMLTextAreaElement | null;
}

const useAutoResizeTextArea = (value: string): React.RefObject<HTMLTextAreaElement> => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null!);

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