<template>
  <div class="chat-main">
    <div ref="messageList" class="message-list">
      <template v-if="store.activeConversation">
        <div
          v-for="(msg, i) in store.activeConversation.messages"
          :key="i"
          :class="['message', msg.role]"
        >
          <div class="message-role">
            {{ msg.role === 'user' ? 'You' : store.activeEndpoint.name }}
          </div>
          <div class="message-content" v-text="msg.content || (store.isStreaming && i === store.activeConversation.messages.length - 1 ? '' : '...')" />
        </div>

        <div v-if="store.isStreaming" class="streaming-indicator">
          <q-spinner-dots size="16px" />
          <span>Streaming... ({{ elapsed }}s)</span>
        </div>
      </template>

      <div v-else class="empty-state">
        <q-icon name="smart_toy" size="48px" color="grey-5" />
        <div class="text-grey q-mt-sm">
          Start a new conversation or select one from the sidebar
        </div>
      </div>
    </div>

    <div class="input-area">
      <q-input
        v-model="inputText"
        outlined
        dense
        autogrow
        placeholder="Type a message..."
        :disable="store.isStreaming"
        @keydown="onKeydown"
      >
        <template #append>
          <q-btn
            v-if="store.isStreaming"
            icon="stop"
            flat
            dense
            round
            color="negative"
            @click="store.abortStream()"
          />
          <q-btn
            v-else
            icon="send"
            flat
            dense
            round
            color="primary"
            :disable="!inputText.trim()"
            @click="send"
          />
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onUnmounted } from 'vue';
import { useBootaiStore } from './store';

const store = useBootaiStore();
const inputText = ref('');
const messageList = ref<HTMLElement | null>(null);

const elapsed = computed(() => {
  if (!store.isStreaming || !store.streamStartTime) return 0;
  return Math.round((Date.now() - store.streamStartTime) / 1000);
});

let elapsedTimer: ReturnType<typeof setInterval> | null = null;
const elapsedTick = ref(0);

watch(() => store.isStreaming, (streaming) => {
  if (streaming) {
    elapsedTimer = setInterval(() => elapsedTick.value++, 1000);
  } else {
    if (elapsedTimer) clearInterval(elapsedTimer);
    elapsedTick.value = 0;
  }
});

onUnmounted(() => {
  if (elapsedTimer) clearInterval(elapsedTimer);
});

function scrollToBottom() {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight;
    }
  });
}

watch(
  () => store.activeConversation?.messages.length,
  () => scrollToBottom()
);

watch(
  () => store.streamingContent,
  () => scrollToBottom()
);

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}

async function send() {
  const text = inputText.value.trim();
  if (!text || store.isStreaming) return;
  inputText.value = '';
  await store.sendMessage(text);
}
</script>

<style scoped>
.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.7;
}

.message {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 85%;
}

.message.user {
  background: var(--q-primary, #1976d2);
  color: white;
  margin-left: auto;
}

.message.assistant {
  background: #f0f0f0;
  color: #222;
  margin-right: auto;
}

.message-role {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 2px;
  opacity: 0.7;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  font-size: 12px;
  color: #888;
}

.input-area {
  padding: 8px 12px;
  border-top: 1px solid #e0e0e0;
}
</style>
