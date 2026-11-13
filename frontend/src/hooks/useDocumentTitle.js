import { useEffect } from 'react';

// Sets the browser tab title for a page.
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} – Inkwell` : 'Inkwell – Blog Platform';
  }, [title]);
}
