import { useCallback } from 'react';

interface VSCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

// Acquire VS Code API - can only be called once
const vscode: VSCodeApi = (() => {
  // Check if we're in a VS Code webview
  if (typeof acquireVsCodeApi === 'function') {
    return acquireVsCodeApi();
  }
  // Mock for development outside VS Code
  return {
    postMessage: (message: unknown) => console.log('postMessage:', message),
    getState: () => undefined,
    setState: (state: unknown) => console.log('setState:', state),
  };
})();

export function useVSCodeApi() {
  const postMessage = useCallback((type: string, payload?: unknown) => {
    vscode.postMessage({ type, payload });
  }, []);

  const startWork = useCallback((issueId: string) => {
    postMessage('startWork', { issueId });
  }, [postMessage]);

  const openInBrowser = useCallback((url: string) => {
    postMessage('openInBrowser', { url });
  }, [postMessage]);

  const refresh = useCallback(() => {
    postMessage('refresh');
  }, [postMessage]);

  const ready = useCallback(() => {
    postMessage('ready');
  }, [postMessage]);

  return {
    postMessage,
    startWork,
    openInBrowser,
    refresh,
    ready,
    getState: vscode.getState,
    setState: vscode.setState,
  };
}
