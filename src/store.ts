import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Endpoint {
  id: string;
  name: string;
  url: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  endpointId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

const STORAGE_KEY = 'bootai-chat-plugin';

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function defaultEndpoint(): Endpoint {
  return {
    id: 'default-bootai',
    name: 'Dell E6510',
    url: 'http://192.168.0.101:8080/v1',
    model: 'bootai-smollm2-135m',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 256,
  };
}

export const useBootaiStore = defineStore('bootai-chat', () => {
  const endpoints = ref<Endpoint[]>([defaultEndpoint()]);
  const activeEndpointId = ref<string>('default-bootai');
  const conversations = ref<Conversation[]>([]);
  const activeConversationId = ref<string | null>(null);
  const isStreaming = ref(false);
  const streamingContent = ref('');
  const streamStartTime = ref(0);
  const connectionStatus = ref<Record<string, 'idle' | 'ok' | 'error'>>({});
  const abortController = ref<AbortController | null>(null);

  const activeEndpoint = computed(() =>
    endpoints.value.find((e) => e.id === activeEndpointId.value) ?? endpoints.value[0]
  );

  const endpointConversations = computed(() =>
    conversations.value
      .filter((c) => c.endpointId === activeEndpointId.value)
      .sort((a, b) => b.createdAt - a.createdAt)
  );

  const activeConversation = computed(() =>
    conversations.value.find((c) => c.id === activeConversationId.value) ?? null
  );

  function persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          endpoints: endpoints.value,
          activeEndpointId: activeEndpointId.value,
          conversations: conversations.value,
          activeConversationId: activeConversationId.value,
        })
      );
    } catch {}
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.endpoints?.length) endpoints.value = data.endpoints;
      if (data.activeEndpointId) activeEndpointId.value = data.activeEndpointId;
      if (data.conversations) conversations.value = data.conversations;
      if (data.activeConversationId) activeConversationId.value = data.activeConversationId;
    } catch {}
  }

  function addEndpoint(ep: Omit<Endpoint, 'id'>) {
    const newEp: Endpoint = { ...ep, id: genId() };
    endpoints.value.push(newEp);
    persist();
    return newEp;
  }

  function updateEndpoint(id: string, updates: Partial<Endpoint>) {
    const ep = endpoints.value.find((e) => e.id === id);
    if (ep) {
      Object.assign(ep, updates);
      persist();
    }
  }

  function removeEndpoint(id: string) {
    endpoints.value = endpoints.value.filter((e) => e.id !== id);
    conversations.value = conversations.value.filter((c) => c.endpointId !== id);
    if (activeEndpointId.value === id && endpoints.value.length) {
      activeEndpointId.value = endpoints.value[0].id;
    }
    if (activeConversationId.value && !conversations.value.find((c) => c.id === activeConversationId.value)) {
      activeConversationId.value = endpointConversations.value[0]?.id ?? null;
    }
    persist();
  }

  function switchEndpoint(id: string) {
    activeEndpointId.value = id;
    const epConvos = conversations.value.filter((c) => c.endpointId === id);
    activeConversationId.value = epConvos.length ? epConvos.sort((a, b) => b.createdAt - a.createdAt)[0].id : null;
    persist();
  }

  function newConversation() {
    const conv: Conversation = {
      id: genId(),
      endpointId: activeEndpointId.value,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    conversations.value.push(conv);
    activeConversationId.value = conv.id;
    persist();
    return conv;
  }

  function deleteConversation(id: string) {
    conversations.value = conversations.value.filter((c) => c.id !== id);
    if (activeConversationId.value === id) {
      activeConversationId.value = endpointConversations.value[0]?.id ?? null;
    }
    persist();
  }

  function switchConversation(id: string) {
    activeConversationId.value = id;
    persist();
  }

  function abortStream() {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }
    isStreaming.value = false;
  }

  async function sendMessage(content: string) {
    let conv = activeConversation.value;
    if (!conv) conv = newConversation();

    const userMsg: ChatMessage = { role: 'user', content, timestamp: Date.now() };
    conv.messages.push(userMsg);

    if (conv.title === 'New Chat' && content.length > 0) {
      conv.title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
    }

    const assistantMsg: ChatMessage = { role: 'assistant', content: '', timestamp: Date.now() };
    conv.messages.push(assistantMsg);

    isStreaming.value = true;
    streamingContent.value = '';
    streamStartTime.value = Date.now();

    const ep = activeEndpoint.value;
    const ac = new AbortController();
    abortController.value = ac;

    try {
      const baseUrl = ep.url.replace(/\/+$/, '');
      const url = `${baseUrl}/chat/completions`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (ep.apiKey) headers['Authorization'] = `Bearer ${ep.apiKey}`;

      const isSSE = ep.url.includes('openai.com') || ep.url.includes('localhost:11434');
      const res = await fetch(url, {
        method: 'POST',
        headers,
        signal: ac.signal,
        body: JSON.stringify({
          model: ep.model,
          messages: conv.messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
          temperature: ep.temperature,
          max_tokens: ep.maxTokens,
          ...(isSSE ? { stream: true } : {}),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const contentType = res.headers.get('content-type') ?? '';
      const isStreamResponse = contentType.includes('text/event-stream') || contentType.includes('text/plain; charset=utf-8');

      if (isStreamResponse && res.body) {
        // SSE streaming response (OpenAI, Ollama, etc.)
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (ac.signal.aborted) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try {
              const chunk = JSON.parse(data);
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) {
                streamingContent.value += delta;
                assistantMsg.content = streamingContent.value;
              }
            } catch {}
          }
        }
      } else {
        // Non-streaming JSON response (BootAI, etc.)
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content ?? '';
        assistantMsg.content = content;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        assistantMsg.content = streamingContent.value || '[Aborted]';
      } else {
        assistantMsg.content = streamingContent.value
          ? streamingContent.value + `\n\n[Error: ${err.message}]`
          : `Error: ${err.message || err}`;
      }
    } finally {
      isStreaming.value = false;
      streamingContent.value = '';
      abortController.value = null;
      persist();
    }
  }

  async function testConnection(endpointId: string): Promise<boolean> {
    const ep = endpoints.value.find((e) => e.id === endpointId);
    if (!ep) return false;

    connectionStatus.value[endpointId] = 'idle';

    try {
      const baseUrl = ep.url.replace(/\/+$/, '');
      const headers: Record<string, string> = {};
      if (ep.apiKey) headers['Authorization'] = `Bearer ${ep.apiKey}`;

      const res = await fetch(`${baseUrl}/models`, { headers, signal: AbortSignal.timeout(5000) });
      connectionStatus.value[endpointId] = res.ok ? 'ok' : 'error';
      return res.ok;
    } catch {
      connectionStatus.value[endpointId] = 'error';
      return false;
    }
  }

  return {
    endpoints,
    activeEndpointId,
    conversations,
    activeConversationId,
    isStreaming,
    streamingContent,
    streamStartTime,
    connectionStatus,
    activeEndpoint,
    endpointConversations,
    activeConversation,
    loadFromStorage,
    addEndpoint,
    updateEndpoint,
    removeEndpoint,
    switchEndpoint,
    newConversation,
    deleteConversation,
    switchConversation,
    sendMessage,
    testConnection,
    abortStream,
    persist,
  };
});
