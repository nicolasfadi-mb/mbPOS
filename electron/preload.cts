import { contextBridge, ipcRenderer } from 'electron';

/**
 * Sends a GET request to the backend via the main process.
 * This uses a standard function declaration to avoid arrow-function generic ambiguity in .cts files.
 */
function get<T>(endpoint: string): Promise<T> {
  return ipcRenderer.invoke('api-get', endpoint).then(result => {
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data as T;
  });
}

/**
 * Sends a POST request to the backend via the main process.
 */
function post<T>(endpoint: string, body: any): Promise<T> {
  return ipcRenderer.invoke('api-post', endpoint, body).then(result => {
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data as T;
  });
}

// Define the API object that will be exposed to the renderer process
export const api = {
  get,
  post,
};

// Securely expose the `api` object to the renderer process
contextBridge.exposeInMainWorld('api', api);