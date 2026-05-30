import { useCallback, useRef, useState, useEffect } from 'react';
import { getWsBase } from '../api/client';
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
  const wsRef = useRef(null);
  const [state, setState] = useState(initialState);

  const patch = useCallback((partial) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setState(initialState);
  }, []);

  const connect = useCallback(
    (materialId, rangeStr, displayName) => {
      disconnect();

      const base = getWsBase();
      const url = `${base}/ws/lobby/${materialId}/${rangeStr}?name=${encodeURIComponent(displayName)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      patch({
        status: 'connecting',
        error: null,
        leaderboard: [],
      });

      ws.onopen = () => patch({ status: 'lobby' });

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'lobby_state':
              patch({
                status: msg.status,
                playerCount: msg.player_count,
                players: msg.players || [],
                countdown: msg.countdown ?? null,
              });
              break;

            case 'quiz_start':
              patch({
                status: 'live',
                questionCount: msg.question_count,
                countdown: 0,
              });
              break;

            case 'new_question':
              patch({
                currentQuestion: msg.question,
                currentQIndex: msg.index,
                timeout: msg.timeout,
                myAnswerAck: null,
                whoAnswered: [],
                roundResult: null,
              });
              break;

            case 'answer_ack':
              patch({ myAnswerAck: { correct: msg.correct } });
              break;

            case 'player_answered':
              setState(prev => ({
                ...prev,
                whoAnswered: [...prev.whoAnswered, msg.player_id]
              }));
              break;

            case 'round_result':
              patch({
                roundResult: {
                  correct_choice: msg.correct_choice,
                  player_choices: msg.player_choices
                },
                leaderboard: msg.leaderboard || []
              });
              break;

            case 'session_finished':
              patch({
                status: 'finished',
                leaderboard: msg.leaderboard || [],
              });
              break;

            case 'error':
              patch({ error: msg.message });
              break;

            case 'pong':
              break;
            default:
              break;
          }
        } catch {
          patch({ error: ar.errors.invalidMessage });
        }
      };

      ws.onerror = () => patch({ error: ar.errors.connection, status: 'error' });

      ws.onclose = () => {
        if (wsRef.current === ws) {
          setState((prev) =>
            prev.status === 'finished'
              ? prev
              : { ...prev, status: prev.status === 'error' ? 'error' : 'disconnected' }
          );
        }
      };
    },
    [disconnect, patch]
  );

  const submitAnswer = useCallback((answer) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'submit_answer',
        answer,
      })
    );
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    submitAnswer,
    isConnected: state.status !== 'idle' && state.status !== 'disconnected',
  };
}
