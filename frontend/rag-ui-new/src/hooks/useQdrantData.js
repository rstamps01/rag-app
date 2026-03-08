/**
 * Custom hook for fetching and managing Qdrant data
 */

import { useState, useEffect, useCallback } from 'react';
import { QDRANT_URL } from '../config';

const useQdrantData = (refreshInterval = 30000) => {
  const [data, setData] = useState({
    collections: [],
    health: null,
    metrics: {},
    loading: true,
    error: null
  });

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch(`${QDRANT_URL}/collections`);
      const result = await response.json();
      return result.result?.collections || [];
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }, []);

  const fetchCollectionDetails = useCallback(async (collectionName) => {
    try {
      const response = await fetch(`${QDRANT_URL}/collections/${collectionName}`);
      const result = await response.json();
      return result.result;
    } catch (error) {
      console.error(`Error fetching collection ${collectionName}:`, error);
      return null;
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch(`${QDRANT_URL}/health`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching health:', error);
      return { title: 'error', version: 'unknown' };
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${QDRANT_URL}/metrics`);
      const result = await response.text();
      
      // Parse Prometheus metrics
      const metrics = {};
      const lines = result.split('\n');
      lines.forEach(line => {
        if (line && !line.startsWith('#')) {
          const [metric, value] = line.split(' ');
          if (metric && value) {
            metrics[metric] = parseFloat(value);
          }
        }
      });
      
      return metrics;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return {};
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [collections, health, metrics] = await Promise.all([
        fetchCollections(),
        fetchHealth(),
        fetchMetrics()
      ]);

      // Fetch detailed info for each collection
      const collectionDetails = await Promise.all(
        collections.map(collection => fetchCollectionDetails(collection.name))
      );

      const collectionsWithDetails = collections.map((collection, index) => ({
        ...collection,
        details: collectionDetails[index]
      }));

      setData({
        collections: collectionsWithDetails,
        health,
        metrics,
        loading: false,
        error: null
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [fetchCollections, fetchHealth, fetchMetrics, fetchCollectionDetails]);

  useEffect(() => {
    fetchAllData();
    
    const interval = setInterval(fetchAllData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAllData, refreshInterval]);

  return {
    ...data,
    refresh: fetchAllData
  };
};

export default useQdrantData;
