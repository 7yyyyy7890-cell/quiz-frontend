import { useCallback, useRef, useState, useEffect } from 'react';
import { getApiBase } from '../api/client';
import { ar } from '../i18n/ar';

const initialState = {
  status: 'idle',
  playerCount: 0,
  players: [],
  countdown: null,
  
  // Game State
  questionCount: 0,
  currentQuestion: null,
  currentQIndex: 0,
  timeout: 0,
  
  // Round State
  myAnswerAck: null, // { correct: boolean }
  whoAnswered: [], // list of player_ids who answered
  roundResult: null, // { correct_choice, player_choices }
  
  leaderboard: [],
  error: null,
};

export function useLobbySocket() {
  const [state, setState] = useState(initialState);
  const playerIdRef = useRef(null);
  const materialIdRef = useRef(null);
  const rangeStrRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const isConnectedRef = useRef(false);

  const patch = useCallback((partial) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const disconnect = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isConnectedRef.current = false;
    playerIdRef.current = null;
    setState(initialState);
  }, []);

  const pollState = useCallback(async () => {
    if (!isConnectedRef.current) return;
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/lobby/${materialIdRef.current}/${rangeStrRef.current}/state?player_id=${playerIdRef.current}`);
      if (res.ok) {
        const data = await res.json();
        
        patch({
          status: data.status,
          playerCount: data.player_count || 0,
          players: data.players || [],
          countdown: data.countdown ?? null,
          leaderboard: data.leaderboard || [],
          questionCount: data.question_count || 0,
          currentQIndex: data.current_q_idx || 0,
          currentQuestion: data.question || null,
          timeout: data.timeout || 0,
          whoAnswered: data.who_answered || [],
          roundResult: data.round_result || null,
          myAnswerAck: data.my_answer_ack || null,
        });

        if (data.status === 'finished') {
          // Keep polling for a bit just to show results, but we can stop eventually.
        }
      }
    } catch (e) {
      console.error("Polling error:", e);
    }
  }, [patch]);

  const connect = useCallback(
    async (materialId, rangeStr, displayName) => {
      disconnect();

      materialIdRef.current = materialId;
      rangeStrRef.current = rangeStr;

      patch({
        status: 'connecting',
        error: null,
        leaderboard: [],
      });

      try {
        const base = getApiBase();
        const res = await fetch(`${base}/lobby/${materialId}/${rangeStr}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: displayName })
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to join');
        }
        
        const data = await res.json();
        playerIdRef.current = data.player_id;
        isConnectedRef.current = true;
        
        // Start polling every 1 second
        pollState();
        pollingIntervalRef.current = setInterval(pollState, 1000);
        
      } catch (err) {
        patch({ error: err.message, status: 'error' });
      }
    },
    [disconnect, patch, pollState]
  );

  const submitAnswer = useCallback(async (answer) => {
    if (!isConnectedRef.current || !playerIdRef.current) return;
    
    // Optimistic update
    patch({ myAnswerAck: { correct: null } }); // Just indicating we answered

    try {
      const base = getApiBase();
      await fetch(`${base}/lobby/${materialIdRef.current}/${rangeStrRef.current}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerIdRef.current, answer })
      });
      // The next poll will update the exact correctness and who answered.
      pollState();
    } catch (e) {
      console.error("Submit answer error:", e);
    }
  }, [patch, pollState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    submitAnswer,
    isConnected: state.status !== 'idle' && state.status !== 'disconnected' && state.status !== 'error',
  };
}
