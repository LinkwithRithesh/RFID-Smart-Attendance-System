/**
 * SmartAttend Realtime SSE Service
 *
 * Replaces the in-memory reactive event bus with real Server-Sent Events (SSE)
 * connections to:
 * - `/attendance-sessions/:id/stream` (Classroom live attendance feed)
 * - `/devices/telemetry/stream` (IoT device hardware fleet status)
 *
 * Exposes the identical `subscribe(event, callback)` interface so components
 * require zero structural alterations.
 */

import { apiClient } from "./apiClient";

export type EventCallback<T = any> = (data: T) => void;

class RealtimeService {
  private sseBaseUrl: string;
  private activeStreams: Map<string, EventSource> = new Map();
  private subscribers: Map<string, Set<EventCallback>> = new Map();
  private connectionStatusListeners: Set<(connected: boolean, channel: string) => void> = new Set();

  constructor() {
    this.sseBaseUrl =
      process.env.NEXT_PUBLIC_SSE_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:5000/api/v1";
  }

  /**
   * Subscribe to a real-time event channel.
   * Channels:
   * - `session:<sessionId>`: Class attendance scans
   * - `device:telemetry`: Real-time IoT turnstiles telemetry
   * - `store:update`: Generic update notification for mock fallback or global refreshes
   */
  public subscribe<T = any>(channel: string, callback: EventCallback<T>): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);

    // If it's an SSE channel, ensure an active EventSource connection
    if (channel.startsWith("session:") || channel === "device:telemetry") {
      this.ensureStreamConnection(channel);
    }

    return () => {
      const set = this.subscribers.get(channel);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.subscribers.delete(channel);
          this.closeStream(channel);
        }
      }
    };
  }

  /**
   * Status change listener for "Reconnecting..." banners in the UI
   */
  public onConnectionChange(listener: (connected: boolean, channel: string) => void): () => void {
    this.connectionStatusListeners.add(listener);
    return () => this.connectionStatusListeners.delete(listener);
  }

  private notifyConnection(connected: boolean, channel: string) {
    this.connectionStatusListeners.forEach((fn) => {
      try {
        fn(connected, channel);
      } catch (err) {
        console.error("Connection status listener error:", err);
      }
    });
  }

  public notifySubscribers(channel: string, data: any) {
    const listeners = this.subscribers.get(channel);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in realtime subscriber on channel ${channel}:`, err);
        }
      });
    }
  }

  private ensureStreamConnection(channel: string) {
    if (typeof window === "undefined") return;
    if (this.activeStreams.has(channel)) return;

    let streamUrl = "";
    const token = apiClient.getToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";

    if (channel.startsWith("session:")) {
      const sessionId = channel.split(":")[1];
      streamUrl = `${this.sseBaseUrl}/attendance-sessions/${sessionId}/stream${tokenParam}`;
    } else if (channel === "device:telemetry") {
      streamUrl = `${this.sseBaseUrl}/devices/telemetry/stream${tokenParam}`;
    }

    if (!streamUrl) return;

    try {
      const eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        this.notifyConnection(true, channel);
      };

      eventSource.onerror = () => {
        // EventSource will automatically attempt reconnection
        this.notifyConnection(false, channel);
      };

      if (channel.startsWith("session:")) {
        eventSource.addEventListener("attendance", (event: MessageEvent) => {
          try {
            const parsed = JSON.parse(event.data);
            this.notifySubscribers(channel, parsed);
          } catch (e) {
            console.error("Failed to parse SSE attendance event:", e);
          }
        });
      } else if (channel === "device:telemetry") {
        eventSource.addEventListener("telemetry", (event: MessageEvent) => {
          try {
            const parsed = JSON.parse(event.data);
            this.notifySubscribers(channel, parsed);
          } catch (e) {
            console.error("Failed to parse SSE telemetry event:", e);
          }
        });
      }

      this.activeStreams.set(channel, eventSource);
    } catch (err) {
      console.warn(`Could not connect to SSE on ${channel}:`, err);
    }
  }

  private closeStream(channel: string) {
    const stream = this.activeStreams.get(channel);
    if (stream) {
      stream.close();
      this.activeStreams.delete(channel);
    }
  }
}

export const realtimeService = new RealtimeService();
