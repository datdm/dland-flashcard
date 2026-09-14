import { useCallback } from 'react';
import { syncApi } from '../services/api';
import { useStore, Notebook } from '../store/useStore';

export function useSync() {
  const { setNotebooks, notebooks, setIsSyncing, setLastSyncAt, isSyncing } = useStore();

  const syncFromServer = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncApi.getData();
      const data = res.data?.data || {};
      const notebooksData = data['flashcash-notebooks'];
      if (notebooksData?.notebooks) {
        setNotebooks(notebooksData.notebooks as Notebook[]);
      }
      setLastSyncAt(new Date().toISOString());
    } catch (e) {
      console.error('Sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const syncToServer = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncApi.uploadData(
        { 'flashcash-notebooks': { notebooks } },
        true
      );
      setLastSyncAt(new Date().toISOString());
    } catch (e) {
      console.error('Upload error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [notebooks, isSyncing]);

  return { syncFromServer, syncToServer, isSyncing };
}
