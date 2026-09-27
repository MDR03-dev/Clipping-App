import { useEffect, useState } from 'react';

interface SSEEvent {
  event: string;
  data: any;
}

export function useSSE() {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => setIsConnected(true);
    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents(prev => [...prev.slice(-50), { event: 'message', data }]);
      } catch {
        setEvents(prev => [...prev.slice(-50), { event: 'message', data: event.data }]);
      }
    };

    // Listen for custom named events
    const eventTypes = ['progress', 'render', 'analysis', 'publish', 'error'];
    eventTypes.forEach(type => {
      eventSource.addEventListener(type, (event: any) => {
        try {
          const data = JSON.parse(event.data);
          setEvents(prev => [...prev.slice(-50), { event: type, data }]);
        } catch {
          setEvents(prev => [...prev.slice(-50), { event: type, data: event.data }]);
        }
      });
    });

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, []);

  return { events, isConnected };
}

export default useSSE;